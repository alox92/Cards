import "@/shims/processShim";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "@/app/ErrorBoundary";
import { logger } from "@/utils/logger";
import "./index.css";
import "@/application/migrations/migrateDataUrlImagesToMedia";
import { ServiceProvider } from "@/ui/components/providers/ServiceProvider";
import { getFPSMonitor } from "@/utils/fpsMonitor";
import FLAGS from "@/utils/featureFlags";
import { PERFORMANCE_BUDGETS } from "@/utils/performanceBudgets";
import { reflowAuditor } from "@/utils/reflowAudit";
import { PerformanceOptimizer } from "@/utils/performanceOptimizer";
import { container } from "@/application/Container";
// Correct: fichier réel dans services racine (pas sous dossier search)
import { SEARCH_INDEX_SERVICE_TOKEN } from "@/application/services/SearchIndexService";
import { INSIGHT_SERVICE_TOKEN } from "@/application/services/InsightService";
import { LEARNING_FORECAST_SERVICE_TOKEN } from "@/application/services/LearningForecastService";
import { ADAPTIVE_ORCHESTRATOR_TOKEN } from "@/application/services/AdaptiveOrchestratorService";

// Import du service worker pour PWA (Phase 3 réactivation)
import { registerSW } from "virtual:pwa-register";
import "@/application/integration/gamificationBridge";
import { reportWebVitals } from "@/app/performance/reportWebVitals";

// Configuration du service worker (prompt minimal)
const updateSW = registerSW({
  onNeedRefresh() {
    logger.info("PWA", "Mise à jour disponible");
    if (
      confirm(
        "Une nouvelle version de Cards est disponible. Installer maintenant ?"
      )
    ) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    logger.info("PWA", "Application prête hors-ligne");
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ServiceProvider>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </ServiceProvider>
  </React.StrictMode>
);

// Démarrage monitor global dev (si non déjà lancé par App) + flush batch périodique
{
  // Activation diagnostics via param URL ?diag=1 même en prod
  const params = new URLSearchParams(window.location.search);
  if (params.get("diag") === "1") {
    (FLAGS as any).diagnosticsEnabled = true;
    logger.info("Diagnostics", "Activation via param URL ?diag=1");
  }
  // Activation automatique reflow auditor si diagnostics actifs en dev
  if (FLAGS.diagnosticsEnabled && (import.meta as any).env?.DEV) {
    reflowAuditor.enable();
  }

  if (FLAGS.diagnosticsEnabled) {
    const mon = getFPSMonitor();
    if (!(mon as any).running) mon.start();
    setInterval(() => logger.flushBatch(), 5000);
    const budget = PERFORMANCE_BUDGETS;
    setInterval(() => {
      const stats = mon.getStats() as any;
      if (stats.avg && stats.avg < budget.fpsMinAcceptable) {
        logger.warn("PerformanceBudget", "FPS en dessous du minimum", {
          avg: stats.avg,
          minAcceptable: budget.fpsMinAcceptable,
        });
      }
      const mem: any = (performance as any).memory;
      if (mem?.usedJSHeapSize) {
        const mb = mem.usedJSHeapSize / 1024 / 1024;
        if (mb > budget.memoryHardLimitMB) {
          logger.error("PerformanceBudget", "Dépassement mémoire HARD", {
            usedMB: Math.round(mb),
            hard: budget.memoryHardLimitMB,
          });
        } else if (mb > budget.memorySoftLimitMB) {
          logger.warn("PerformanceBudget", "Dépassement mémoire SOFT", {
            usedMB: Math.round(mb),
            soft: budget.memorySoftLimitMB,
          });
        }
      }
    }, 6000);
  }

  // ===================== WARM-UP & IDLE TASKS (multi-cœur) =====================
  const isDev = (import.meta as any).env?.DEV;
  // Heuristique d'activité utilisateur pour priorisation adaptative
  let lastUserInput = Date.now();
  let consecutiveRapidInputs = 0;
  const userEvents = ["pointerdown", "keydown", "wheel", "touchstart"];
  userEvents.forEach((ev) =>
    window.addEventListener(
      ev,
      () => {
        const now = Date.now();
        if (now - lastUserInput < 400) {
          consecutiveRapidInputs++;
        } else {
          consecutiveRapidInputs = 0;
        }
        lastUserInput = now;
        if (consecutiveRapidInputs >= 2) {
          cancelLongWarmups();
        }
      },
      { passive: true }
    )
  );
  function shouldDefer() {
    return Date.now() - lastUserInput < 500;
  } // si input < 500ms, on diffère
  const abortRegistry = new Set<AbortController>();
  function cancelLongWarmups() {
    abortRegistry.forEach((c) => c.abort());
    abortRegistry.clear();
    logger.info("Warmup", "Cancelled long warmups after rapid user input");
  }
  // Pause warmups si onglet caché
  let pageHidden = document.visibilityState === "hidden";
  document.addEventListener("visibilitychange", () => {
    pageHidden = document.visibilityState === "hidden";
  });
  function guarded(task: () => void | Promise<void>) {
    let deferCount = 0;
    const MAX_DEFERS = 6; // évite famine: ~ (6 * 400ms) max ~2.4s de délai
    return () => {
      if ((shouldDefer() || pageHidden) && deferCount < MAX_DEFERS) {
        deferCount++;
        setTimeout(
          () =>
            PerformanceOptimizer.scheduleIdle(
              guarded(task),
              600 + deferCount * 100
            ),
          400 + deferCount * 50
        );
        return;
      }
      task();
    };
  }
  PerformanceOptimizer.scheduleIdle(
    guarded(() => {
      try {
        PerformanceOptimizer.warmupGPU();
      } catch {}
    }),
    800
  );

  // Pré-chauffage Dexie: petite requête pour hydrater caches index
  PerformanceOptimizer.scheduleIdle(
    guarded(async () => {
      try {
        // lazy import du repo pour éviter coût synchrone
        // lazy import token depuis couche domaine plutôt que repo concret
        const { CARD_REPOSITORY_TOKEN } = await import(
          "@/domain/repositories/CardRepository"
        );
        const cardRepo: any = container.resolve(CARD_REPOSITORY_TOKEN);
        // petite opération neutre pour déclencher ouverture DB & caches index
        try {
          await cardRepo.getById?.("__warmup__");
        } catch {}
      } catch {}
    }),
    1200
  );

  // Pré-chargement index de recherche minimal (si pas encore construit)
  PerformanceOptimizer.scheduleIdle(
    guarded(async () => {
      if (isDev) return; // Skip heavy search indexing in dev
      try {
        const search = container.resolve<any>(SEARCH_INDEX_SERVICE_TOKEN);
        if (search && !search.isPrimed?.()) {
          const ctrl = new AbortController();
          abortRegistry.add(ctrl);
          await search.prime?.(50, ctrl.signal); // indexer un petit batch initial (support signal optionnel)
          abortRegistry.delete(ctrl);
        }
      } catch (e) {
        logger.debug("Warmup", "Search prime skip", { error: String(e) });
      }
    }),
    1600
  );

  // Pré-calcul insights + forecast (non bloquant)
  PerformanceOptimizer.scheduleIdle(
    guarded(async () => {
      if (isDev) return; // Skip heavy analytics in dev
      try {
        const insight = container.resolve<any>(INSIGHT_SERVICE_TOKEN);
        const forecast = container.resolve<any>(
          LEARNING_FORECAST_SERVICE_TOKEN
        );
        const ctrl1 = new AbortController();
        const ctrl2 = new AbortController();
        abortRegistry.add(ctrl1);
        abortRegistry.add(ctrl2);
        await Promise.allSettled([
          (async () => {
            if (!ctrl1.signal.aborted) await insight?.generate?.(false);
          })(),
          (async () => {
            if (!ctrl2.signal.aborted) await forecast?.warmup?.();
          })(),
        ]);
        abortRegistry.delete(ctrl1);
        abortRegistry.delete(ctrl2);
      } catch {}
    }),
    2200
  );

  // Orchestrateur: chargement des poids adaptatifs puis auto-ajust warmup
  PerformanceOptimizer.scheduleIdle(
    guarded(async () => {
      if (isDev) return; // Skip heavy orchestration in dev
      try {
        const orchestrator = container.resolve<any>(
          ADAPTIVE_ORCHESTRATOR_TOKEN
        );
        const ctrl = new AbortController();
        abortRegistry.add(ctrl);
        if (!ctrl.signal.aborted) {
          await orchestrator?.warmup?.(ctrl.signal);
        }
        abortRegistry.delete(ctrl);
      } catch {}
    }),
    2600
  );

  // Orchestrateur second pass (post forecast/insight) pour snapshot stable
  PerformanceOptimizer.scheduleIdle(() => {
    if (isDev) return;
    try {
      (container as any)
        .safeResolve?.("AdaptiveOrchestratorService")
        ?.warmup?.();
    } catch {}
  }, 3200);

  // Parallelisation heuristique selon nombre de cœurs
  PerformanceOptimizer.scheduleIdle(
    guarded(() => {
      const cores = (navigator as any).hardwareConcurrency || 4;
      logger.info("Perf", "Cœurs détectés", { cores });
      // Ajuster pools / batch size dynamiquement
      try {
        if (cores >= 8) {
          (window as any).__CARDS_CPU_PROFILE__ = {
            poolSize: Math.min(cores - 2, 6),
            batch: 512,
          };
        } else {
          (window as any).__CARDS_CPU_PROFILE__ = {
            poolSize: Math.min(cores - 1, 4),
            batch: 256,
          };
        }
      } catch {}
    }),
    3000
  );

  // Préchargement progressif de composants lourds (éditeur riche) après LCP estimée
  PerformanceOptimizer.scheduleIdle(
    guarded(async () => {
      if (isDev) return;
      try {
        await import("@/ui/components/Editor/UltraRichTextEditor");
      } catch {}
    }),
    3400
  );

  // Web Vitals instrumentation (après warmups majeurs)
  if (FLAGS.diagnosticsEnabled) {
    PerformanceOptimizer.scheduleIdle(
      guarded(() => {
        try {
          reportWebVitals();
        } catch {}
      }),
      3600
    );
  }

  // Prefetch dynamique de bundles critiques (si navigateur supporte priorityHint)
  PerformanceOptimizer.scheduleIdle(
    guarded(() => {
      try {
        const supportsPriority = "priority" in HTMLLinkElement.prototype;
        if (supportsPriority) {
          const critical = [
            "/src/ui/components/Study/StudySessionView.tsx",
            "/src/ui/components/Deck/DeckDetailPanel.tsx",
          ];
          for (const href of critical) {
            const l = document.createElement("link");
            l.rel = "prefetch";
            (l as any).priority = "low";
            l.href = href;
            document.head.appendChild(l);
          }
        }
      } catch {}
    }),
    4200
  );
}
