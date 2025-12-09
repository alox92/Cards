import { logger } from "@/utils/logger";
import { PerformanceError } from "@/utils/errors";
import { FLAGS } from "@/utils/featureFlags";

interface FPSMonitorOptions {
  intervalMs?: number;
  sampleSize?: number;
  warnBelow?: number;
  /** Nombre d'intervalles consécutifs sous le seuil avant une erreur */
  lowThresholdBeforeError?: number;
  /** Cooldown mini entre deux erreurs (ms) */
  errorCooldownMs?: number;
  /** Activer adaptation dynamique si FPS durablement bas */
  adaptiveThreshold?: boolean;
  /** Warn minimal pour adaptation */
  minAdaptiveWarnBelow?: number;
  /** Silence des WARN après une erreur (ms) */
  quietAfterErrorMs?: number;
}

export class FPSMonitor {
  private frames: number[] = [];
  private lastTime = performance.now();
  private rafId: number | null = null;
  private running = false;
  private options: Required<Omit<FPSMonitorOptions, "warnBelow">> & {
    warnBelow: number;
  };
  private lastReport = 0;
  private consecutiveLow = 0;
  private lastErrorTime = 0;
  private adaptiveApplied = 0;
  private paused = false;
  private adaptationsHistory: { ts: number; newWarnBelow: number }[] = [];
  private lowSeries: { ts: number; avg: number }[] = [];

  private quietUntil = 0;
  constructor(opts: FPSMonitorOptions = {}) {
    const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env
      ?.DEV;
    const baseWarn = opts.warnBelow ?? (isDev ? 10 : 50);
    this.options = {
      intervalMs: opts.intervalMs ?? 3500,
      sampleSize: opts.sampleSize ?? 120,
      warnBelow: baseWarn,
      lowThresholdBeforeError: opts.lowThresholdBeforeError ?? 3,
      errorCooldownMs: opts.errorCooldownMs ?? 6000,
      adaptiveThreshold: opts.adaptiveThreshold ?? true,
      minAdaptiveWarnBelow: opts.minAdaptiveWarnBelow ?? 30,
      quietAfterErrorMs: opts.quietAfterErrorMs ?? 8000,
    };
  }

  private loop = () => {
    if (!this.running) {
      // Guard: cancel animation frame si running=false
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      return;
    }

    try {
      const now = performance.now();
      const delta = now - this.lastTime;
      if (delta > 0 && !this.paused) {
        const fps = 1000 / delta;
        this.frames.push(fps);
        if (this.frames.length > this.options.sampleSize) this.frames.shift();
      }
      this.lastTime = now;
      if (now - this.lastReport >= this.options.intervalMs) {
        if (!this.paused) this.report();
        this.lastReport = now;
      }
      this.rafId = requestAnimationFrame(this.loop);
    } catch (error) {
      logger.error("FPS", "Erreur dans loop FPS monitor", { error });
      // Cleanup automatique en cas d'erreur
      this.stop();
    }
  };

  private report() {
    if (!this.frames.length) return;
    const avg = this.frames.reduce((s, f) => s + f, 0) / this.frames.length;
    const min = Math.min(...this.frames);
    const max = Math.max(...this.frames);
    // enregistre point série low/avg
    this.lowSeries.push({ ts: performance.now(), avg });
    if (this.lowSeries.length > 120) this.lowSeries.shift();
    if (FLAGS.diagnosticsEnabled) {
      logger.debug("FPS", "Frame metrics", {
        avg: Number(avg.toFixed(1)),
        min: Number(min.toFixed(1)),
        max: Number(max.toFixed(1)),
        samples: this.frames.length,
      });
    }
    const nowGlobal = performance.now();
    if (avg < this.options.warnBelow) {
      this.consecutiveLow++;
      if (FLAGS.diagnosticsEnabled && nowGlobal >= this.quietUntil) {
        logger.warn("FPS", "FPS moyen bas", {
          avg,
          consecutive: this.consecutiveLow,
          warnBelow: this.options.warnBelow,
        });
      }
      // Erreur si plusieurs intervalles consécutifs ET cooldown écoulé
      const now = performance.now();
      if (
        this.consecutiveLow >= this.options.lowThresholdBeforeError &&
        now - this.lastErrorTime >= this.options.errorCooldownMs
      ) {
        this.lastErrorTime = now;
        if (FLAGS.diagnosticsEnabled) {
          logger.error(
            "Performance",
            "FPS moyen trop bas",
            new PerformanceError("FPS bas", "LOW_FPS", {
              avg,
              consecutive: this.consecutiveLow,
              warnBelow: this.options.warnBelow,
            })
          );
        }
        this.quietUntil = now + this.options.quietAfterErrorMs;
      }
      // Adaptation progressive : si on reste bas trop longtemps, on abaisse légèrement le seuil pour réduire le bruit
      if (
        this.options.adaptiveThreshold &&
        this.consecutiveLow > 0 &&
        this.consecutiveLow % 3 === 0 &&
        this.options.warnBelow > this.options.minAdaptiveWarnBelow
      ) {
        this.options.warnBelow = Math.max(
          this.options.minAdaptiveWarnBelow,
          Math.round(this.options.warnBelow - 3)
        );
        this.adaptiveApplied++;
        this.adaptationsHistory.push({
          ts: performance.now(),
          newWarnBelow: this.options.warnBelow,
        });
        if (FLAGS.diagnosticsEnabled) {
          logger.info("FPS", "Adaptation seuil FPS", {
            newWarnBelow: this.options.warnBelow,
            adaptiveApplied: this.adaptiveApplied,
          });
        }
      }
    } else if (this.consecutiveLow) {
      // Reset quand on revient au dessus
      if (FLAGS.diagnosticsEnabled) {
        logger.info("FPS", "Récupération FPS", {
          avg,
          recoveredAfter: this.consecutiveLow,
        });
      }
      this.consecutiveLow = 0;
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
    if (FLAGS.diagnosticsEnabled) {
      logger.info("FPS", "🟢 Surveillance FPS démarrée");
    }
  }
  stop() {
    if (!this.running) return;
    this.running = false;
    // Cleanup atomique: check strict pour éviter race condition
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (FLAGS.diagnosticsEnabled) {
      logger.info("FPS", "🛑 Surveillance FPS arrêtée");
    }
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    if (FLAGS.diagnosticsEnabled) {
      logger.debug("FPS", "⏸️  Pause monitor (onglet caché)");
    }
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    if (FLAGS.diagnosticsEnabled) {
      logger.debug("FPS", "▶️ Reprise monitor (onglet visible)");
    }
  }

  getStats() {
    const avg = this.frames.length
      ? this.frames.reduce((s, f) => s + f, 0) / this.frames.length
      : 0;
    const min = this.frames.length ? Math.min(...this.frames) : 0;
    const max = this.frames.length ? Math.max(...this.frames) : 0;
    return {
      running: this.running,
      paused: this.paused,
      samples: this.frames.length,
      avg: Number(avg.toFixed(1)),
      min: Number(min.toFixed(1)),
      max: Number(max.toFixed(1)),
      consecutiveLow: this.consecutiveLow,
      warnBelow: this.options.warnBelow,
      adaptiveApplied: this.adaptiveApplied,
      adaptationsHistory: [...this.adaptationsHistory],
      lowSeries: [...this.lowSeries],
    };
  }

  exportHistory() {
    return {
      adaptations: [...this.adaptationsHistory],
      lowSeries: [...this.lowSeries],
    };
  }
}

export type FPSStats = ReturnType<FPSMonitor["getStats"]>;

let singleton: FPSMonitor | null = null;
export function getFPSMonitor() {
  if (!singleton) singleton = new FPSMonitor();
  return singleton;
}

// Pause/reprise automatique selon la visibilité de l'onglet
if (
  typeof document !== "undefined" &&
  typeof document.addEventListener === "function"
) {
  document.addEventListener("visibilitychange", () => {
    if (!singleton) return;
    if (document.visibilityState === "hidden") {
      singleton.pause();
    } else {
      singleton.resume();
    }
  });
}

export default FPSMonitor;
