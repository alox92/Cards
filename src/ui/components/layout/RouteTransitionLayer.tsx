import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { TIMING_CONFIGS } from "@/utils/performanceOptimizer";
import { getPageTransition } from "@/ui/styles/motionProfiles";

export const RouteTransitionLayer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const [animKey, setAnimKey] = useState(location.pathname);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setAnimKey(location.pathname);
  }, [location]);

  const palette = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/study") || path.startsWith("/learn")) {
      return {
        progress: "linear-gradient(90deg, #22d3ee, #6366f1, #a855f7)",
        ambient:
          "radial-gradient(circle at 24% 18%, rgba(45,212,191,0.18), transparent 60%), radial-gradient(circle at 80% 16%, rgba(99,102,241,0.18), transparent 65%), radial-gradient(circle at 52% 100%, rgba(59,130,246,0.12), transparent 75%)",
      };
    }
    if (path.startsWith("/create")) {
      return {
        progress: "linear-gradient(90deg, #f97316, #ec4899, #8b5cf6)",
        ambient:
          "radial-gradient(circle at 20% 16%, rgba(249,115,22,0.18), transparent 62%), radial-gradient(circle at 78% 20%, rgba(236,72,153,0.16), transparent 60%), radial-gradient(circle at 50% 100%, rgba(99,102,241,0.14), transparent 70%)",
      };
    }
    if (path.startsWith("/analyze") || path.startsWith("/stats")) {
      return {
        progress: "linear-gradient(90deg, #10b981, #22d3ee, #6366f1)",
        ambient:
          "radial-gradient(circle at 18% 20%, rgba(16,185,129,0.18), transparent 55%), radial-gradient(circle at 82% 12%, rgba(14,165,233,0.15), transparent 55%), radial-gradient(circle at 50% 100%, rgba(59,130,246,0.12), transparent 70%)",
      };
    }
    return {
      progress: "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)",
      ambient:
        "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.16), transparent 55%), radial-gradient(circle at 80% 15%, rgba(236,72,153,0.16), transparent 60%), radial-gradient(circle at 50% 100%, rgba(14,165,233,0.12), transparent 70%)",
    };
  }, [location.pathname]);

  const pageTransition = getPageTransition();
  const progressDuration = reduceMotion
    ? pageTransition.duration ?? 0.18
    : (pageTransition.duration ?? 0.45) * 1.2;

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${animKey}-progress`}
          className="pointer-events-none fixed top-0 left-0 z-50 h-1 origin-left"
          initial={{ width: "0%", opacity: 1 }}
          animate={{ width: "100%", opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{
            ease: TIMING_CONFIGS.SMOOTH_OUT,
            duration: progressDuration,
            opacity: {
              delay: progressDuration * 0.7,
              duration: 0.25,
              ease: TIMING_CONFIGS.SMOOTH_OUT,
            },
          }}
          style={{ backgroundImage: palette.progress }}
        />
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div
          key={animKey}
          className="fixed inset-0 -z-10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{
            opacity: reduceMotion ? 0.32 : 1,
            background: reduceMotion
              ? "radial-gradient(circle at 50% 20%, rgba(99,102,241,0.12), transparent 60%)"
              : palette.ambient,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration:
              (pageTransition.duration ?? 0.35) * (reduceMotion ? 0.7 : 1.0),
            ease: TIMING_CONFIGS.SMOOTH_OUT,
          }}
        />
      </AnimatePresence>
      {!reduceMotion && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${animKey}-halo`}
            className="pointer-events-none fixed inset-0 -z-10"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 0.35, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{
              duration: (pageTransition.duration ?? 0.35) * 1.1,
              ease: TIMING_CONFIGS.SMOOTH_OUT,
            }}
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08), transparent 65%)",
            }}
          />
        </AnimatePresence>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={animKey}
          className="w-full h-full"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{
            duration: pageTransition.duration ?? (reduceMotion ? 0.15 : 0.35),
            ease: (pageTransition.ease as any) ?? [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
export default RouteTransitionLayer;
