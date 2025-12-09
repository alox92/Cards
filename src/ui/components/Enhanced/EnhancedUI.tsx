/**
 * EnhancedUI - Interface utilisateur améliorée avec micro-interactions
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  getFluidTransitionMastery,
  FluidTransitionMastery,
} from "../../../core/FluidTransitionMastery";
import { useGamification } from "../Gamification/useGamification.ts";

interface MicroInteractionProps {
  children: React.ReactNode;
  type?: "hover" | "click" | "focus" | "success" | "error" | "loading";
  intensity?: "subtle" | "medium" | "strong";
  sound?: boolean;
  haptic?: boolean;
  className?: string;
}

interface FloatingElementProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  duration?: number;
}

interface ParticleEffectProps {
  trigger: boolean;
  type?: "success" | "error" | "magic" | "explosion";
  count?: number;
  colors?: string[];
  onComplete?: () => void;
}

interface GlowButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  glow?: boolean;
  pulse?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

interface MorphingCardProps {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  isFlipped?: boolean;
  onFlip?: (flipped: boolean) => void;
  className?: string;
}

interface LiquidProgressProps {
  progress: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  animated?: boolean;
  showWave?: boolean;
}

// Composant principal pour les micro-interactions
export const MicroInteraction: React.FC<MicroInteractionProps> = ({
  children,
  type = "hover",
  intensity = "medium",
  sound = false,
  haptic = false,
  className = "",
}) => {
  const [isActive, setIsActive] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const transitionRef = useRef<FluidTransitionMastery | null>(null);

  useEffect(() => {
    const initTransition = async () => {
      transitionRef.current = getFluidTransitionMastery();
      await transitionRef.current.initialize();
    };
    initTransition();

    return () => {
      if (transitionRef.current) {
        transitionRef.current.shutdown();
      }
    };
  }, []);

  const playFeedback = useCallback(() => {
    // Son
    if (sound) {
      const audio = new Audio(
        `data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaB`
      );
      audio.volume = 0.1;
      audio.play().catch(() => {}); // Ignore errors
    }

    // Vibration
    if (haptic && navigator.vibrate) {
      navigator.vibrate(
        intensity === "subtle" ? 10 : intensity === "medium" ? 20 : 40
      );
    }
  }, [sound, haptic, intensity]);

  const handleInteraction = useCallback(
    async (active: boolean) => {
      setIsActive(active);

      if (active) {
        playFeedback();

        if (transitionRef.current && elementRef.current) {
          const animationType = type === "click" ? "scale" : "slide-up";
          await transitionRef.current.animateIn(elementRef.current, {
            type: animationType,
            duration:
              intensity === "subtle" ? 150 : intensity === "medium" ? 250 : 350,
            easing: "spring",
          });
        }
      }
    },
    [type, intensity, playFeedback]
  );

  const getIntensityMultiplier = () => {
    switch (intensity) {
      case "subtle":
        return 0.02;
      case "medium":
        return 0.05;
      case "strong":
        return 0.1;
      default:
        return 0.05;
    }
  };

  return (
    <div
      ref={elementRef}
      className={`micro-interaction ${type} ${intensity} ${
        isActive ? "active" : ""
      } ${className}`}
      onMouseEnter={() => type === "hover" && handleInteraction(true)}
      onMouseLeave={() => type === "hover" && handleInteraction(false)}
      onMouseDown={() => type === "click" && handleInteraction(true)}
      onMouseUp={() => type === "click" && handleInteraction(false)}
      onFocus={() => type === "focus" && handleInteraction(true)}
      onBlur={() => type === "focus" && handleInteraction(false)}
      style={{
        transform: isActive
          ? `scale(${1 + getIntensityMultiplier()})`
          : "scale(1)",
        transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
};

// Bouton avec effets de lueur avancés
export const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  glow = true,
  pulse = false,
  loading = false,
  disabled = false,
  onClick,
  className = "",
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const { triggerEvent } = useGamification();

  const handleClick = useCallback(() => {
    if (disabled || loading) return;

    triggerEvent("button-clicked", { variant, size });
    onClick?.();
  }, [disabled, loading, onClick, triggerEvent, variant, size]);

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          boxShadow: glow ? "0 0 20px rgba(102, 126, 234, 0.4)" : "none",
        };
      case "secondary":
        return {
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          boxShadow: glow ? "0 0 20px rgba(240, 147, 251, 0.4)" : "none",
        };
      case "success":
        return {
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          boxShadow: glow ? "0 0 20px rgba(79, 172, 254, 0.4)" : "none",
        };
      case "warning":
        return {
          background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
          boxShadow: glow ? "0 0 20px rgba(250, 112, 154, 0.4)" : "none",
        };
      case "danger":
        return {
          background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
          boxShadow: glow ? "0 0 20px rgba(255, 107, 107, 0.4)" : "none",
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return { padding: "8px 16px", fontSize: "12px", minHeight: "32px" };
      case "md":
        return { padding: "12px 24px", fontSize: "14px", minHeight: "40px" };
      case "lg":
        return { padding: "16px 32px", fontSize: "16px", minHeight: "48px" };
      case "xl":
        return { padding: "20px 40px", fontSize: "18px", minHeight: "56px" };
      default:
        return {};
    }
  };

  return (
    <button
      className={`glow-button ${variant} ${size} ${pulse ? "pulse" : ""} ${
        loading ? "loading" : ""
      } ${disabled ? "disabled" : ""} ${className}`}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      disabled={disabled || loading}
      style={{
        ...getVariantStyles(),
        ...getSizeStyles(),
        transform: isPressed ? "scale(0.98)" : "scale(1)",
        filter: disabled ? "grayscale(1) brightness(0.5)" : "none",
      }}
    >
      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      )}
      <span className={loading ? "loading-text" : ""}>{children}</span>

      <style>{`
        .glow-button {
          position: relative;
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          outline: none;
        }

        .glow-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .glow-button:hover::before {
          left: 100%;
        }

        .glow-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
        }

        .glow-button:focus {
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3) !important;
        }

        .glow-button.pulse {
          animation: button-pulse 2s infinite;
        }

        .glow-button.disabled {
          cursor: not-allowed;
          transform: none !important;
        }

        .loading-spinner {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          opacity: 0;
        }

        @keyframes button-pulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(102, 126, 234, 0.4);
          }
          50% {
            box-shadow: 0 0 30px rgba(102, 126, 234, 0.6);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

// Carte morphing avec animation fluide
export const MorphingCard: React.FC<MorphingCardProps> = ({
  frontContent,
  backContent,
  isFlipped = false,
  onFlip,
  className = "",
}) => {
  const [flipped, setFlipped] = useState(isFlipped);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleFlip = useCallback(() => {
    const newFlipped = !flipped;
    setFlipped(newFlipped);
    onFlip?.(newFlipped);
  }, [flipped, onFlip]);

  useEffect(() => {
    setFlipped(isFlipped);
  }, [isFlipped]);

  return (
    <div className={`morphing-card-container ${className}`}>
      <div
        ref={cardRef}
        className={`morphing-card ${flipped ? "flipped" : ""}`}
        onClick={handleFlip}
      >
        <div className="card-front">{frontContent}</div>
        <div className="card-back">{backContent}</div>
      </div>

      <style>{`
        .morphing-card-container {
          perspective: 1000px;
          width: 100%;
          height: 100%;
        }

        .morphing-card {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.24s cubic-bezier(0.33, 1, 0.68, 1);
          cursor: pointer;
        }

        .morphing-card.flipped {
          transform: rotateY(180deg);
        }

        .card-front, .card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .card-back {
          transform: rotateY(180deg);
        }

        .morphing-card:hover {
          transform: translateY(-5px) rotateY(${flipped ? "180deg" : "0deg"});
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

// Barre de progression liquide
export const LiquidProgress: React.FC<LiquidProgressProps> = ({
  progress,
  color = "#667eea",
  backgroundColor = "rgba(255, 255, 255, 0.1)",
  height = 24,
  animated = true,
  showWave = true,
}) => {
  const progressClamped = Math.max(0, Math.min(100, progress));

  return (
    <div className="liquid-progress" style={{ height, backgroundColor }}>
      <div
        className={`liquid-fill ${animated ? "animated" : ""} ${
          showWave ? "wave" : ""
        }`}
        style={{
          width: `${progressClamped}%`,
          backgroundColor: color,
        }}
      >
        {showWave && (
          <div className="wave-effect" style={{ borderTopColor: color }} />
        )}
      </div>

      <style>{`
        .liquid-progress {
          width: 100%;
          border-radius: ${height / 2}px;
          overflow: hidden;
          position: relative;
        }

        .liquid-fill {
          height: 100%;
          border-radius: ${height / 2}px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .liquid-fill.animated {
          background: linear-gradient(90deg, 
            ${color}dd 0%, 
            ${color} 25%, 
            ${color}dd 50%, 
            ${color} 75%, 
            ${color}dd 100%);
          background-size: 200% 100%;
          animation: liquid-flow 2s ease-in-out infinite;
        }

        .wave-effect {
          position: absolute;
          top: -2px;
          right: -5px;
          width: 10px;
          height: 10px;
          border-top: 4px solid;
          border-radius: 50%;
          animation: wave-bob 1.5s ease-in-out infinite;
        }

        @keyframes liquid-flow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes wave-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
};

// Élément flottant avec animation
export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  delay = 0,
  direction = "up",
  distance = 10,
  duration = 3,
}) => {
  const getDirection = () => {
    switch (direction) {
      case "up":
        return `translateY(-${distance}px)`;
      case "down":
        return `translateY(${distance}px)`;
      case "left":
        return `translateX(-${distance}px)`;
      case "right":
        return `translateX(${distance}px)`;
      default:
        return `translateY(-${distance}px)`;
    }
  };

  return (
    <div
      className="floating-element"
      style={{
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    >
      {children}

      <style>{`
        .floating-element {
          animation: float infinite ease-in-out alternate;
        }

        @keyframes float {
          0% { transform: translateY(0px); }
          100% { transform: ${getDirection()}; }
        }
      `}</style>
    </div>
  );
};

// Effet de particules
export const ParticleEffect: React.FC<ParticleEffectProps> = ({
  trigger,
  count = 20,
  colors = ["#667eea", "#764ba2", "#f093fb", "#f5576c"],
  onComplete,
}) => {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      color: string;
      size: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
    }>
  >([]);

  useEffect(() => {
    if (!trigger) return;

    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 6 + 2,
      x: 50, // Start from center
      y: 50,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      life: 1,
    }));

    setParticles(newParticles);

    // Animation des particules
    const animateParticles = () => {
      setParticles((prev) =>
        prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.5, // Gravité
            life: particle.life - 0.02,
          }))
          .filter((particle) => particle.life > 0)
      );
    };

    const interval = setInterval(animateParticles, 16); // 60fps

    // Nettoyer après 3 secondes
    setTimeout(() => {
      clearInterval(interval);
      setParticles([]);
      onComplete?.();
    }, 3000);

    return () => clearInterval(interval);
  }, [trigger, count, colors, onComplete]);

  if (particles.length === 0) return null;

  return (
    <div className="particle-container">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            width: particle.size,
            height: particle.size,
            opacity: particle.life,
          }}
        />
      ))}

      <style>{`
        .particle-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 9999;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          transition: none;
        }
      `}</style>
    </div>
  );
};

// Composant principal EnhancedUI qui combine tous les éléments
// Note: l'objet EnhancedUI (namespace) a été déplacé dans EnhancedUILib.ts
// pour éviter d'exporter des valeurs non‑composants depuis ce fichier.
