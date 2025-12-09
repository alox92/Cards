import type { ReactNode } from "react";
import FuturisticLayout from "@/ui/components/layout/FuturisticLayout";
import { cn } from "@/utils/cn";

interface WorkspaceGlassLayoutProps {
  children: ReactNode;
  /** Optional max-width class for the inner window (e.g. `max-w-5xl`) */
  maxWidthClassName?: string;
  /** Optional extra classes for the window panel */
  panelClassName?: string;
}

/**
 * WorkspaceGlassLayout
 *
 * Enveloppe commune pour les pages principales (Decks, Hub, Stats, Settings...)
 * avec arrière-plan futuriste et fenêtre vitrée centrale façon "Craft".
 */
export function WorkspaceGlassLayout({
  children,
  maxWidthClassName = "max-w-6xl",
  panelClassName,
}: WorkspaceGlassLayoutProps) {
  return (
    <FuturisticLayout subtle>
      <div className="min-h-screen px-4 py-10 flex items-center justify-center">
        <div className={cn("relative w-full", maxWidthClassName)}>
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -inset-10 bg-gradient-to-tr from-sky-400/25 via-indigo-500/20 to-fuchsia-500/25 opacity-70 blur-3xl" />
            <div className="absolute inset-x-10 -bottom-6 h-24 bg-gradient-to-t from-slate-900/40 to-transparent blur-2xl" />
          </div>
          <div
            className={cn(
              "relative rounded-[32px] border border-white/60 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90",
              "shadow-[0_30px_120px_rgba(15,23,42,0.55)] backdrop-blur-2xl",
              "px-6 py-6 sm:px-8 sm:py-8",
              panelClassName
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </FuturisticLayout>
  );
}

export default WorkspaceGlassLayout;
