import { useEffect } from "react";
import { FeedbackCenterProvider } from "@/ui/components/feedback/FeedbackCenter";
import { ToastProvider } from "@/ui/components/common/Toast";
import { RouteTransitionLayer } from "@/ui/components/layout/RouteTransitionLayer";
import { useTheme } from "@/ui/hooks/useTheme";
import { useSettingsStore } from "@/data/stores/settingsStore";
import useApplyDynamicUISettings from "@/ui/hooks/useApplyDynamicUISettings";
import { applyAccentPalette } from "@/app/theme/palette";
import { initializeDemoDataServices } from "@/data/demoData";
import { InitializationGate } from "@/app/InitializationGate";
import { AppShell } from "@/app/AppShell";
import { RoutesContainer } from "@/app/RoutesContainer";
import { PerformanceOptimizer } from "@/utils/performanceOptimizer";

const THEME_PRESET_PALETTES = {
  solarized: {
    "--accent-color": "#268bd2",
    "--accent-700": "#0f4b66",
    "--bg-base": "#fdf6e3",
    "--bg-alt": "#eee8d5",
    "--text-base": "#073642",
  },
  nord: {
    "--accent-color": "#88c0d0",
    "--accent-700": "#40616e",
    "--bg-base": "#2e3440",
    "--bg-alt": "#3b4252",
    "--text-base": "#eceff4",
  },
  dracula: {
    "--accent-color": "#bd93f9",
    "--accent-700": "#6d4ca8",
    "--bg-base": "#282a36",
    "--bg-alt": "#343746",
    "--text-base": "#f8f8f2",
  },
  gruvbox: {
    "--accent-color": "#fabd2f",
    "--accent-700": "#b57614",
    "--bg-base": "#282828",
    "--bg-alt": "#3c3836",
    "--text-base": "#ebdbb2",
  },
} as const;

type ThemePresetKey = keyof typeof THEME_PRESET_PALETTES;

const THEME_PRESET_VARIABLES = Array.from(
  new Set(Object.values(THEME_PRESET_PALETTES).flatMap(Object.keys))
);

function App() {
  const { theme, toggleTheme } = useTheme();
  const { loadSettings, settings } = useSettingsStore();
  useApplyDynamicUISettings();
  useEffect(() => {
    const accent = settings.accentColor || "#3b82f6";
    PerformanceOptimizer.scheduleIdle(() => {
      applyAccentPalette(accent);
    }, 80);
  }, [settings.accentColor]);

  useEffect(() => {
    const presetKey = settings.themePreset as ThemePresetKey | undefined;
    const root = document.documentElement;
    PerformanceOptimizer.scheduleIdle(() => {
      THEME_PRESET_VARIABLES.forEach((variable) =>
        root.style.removeProperty(variable)
      );
      if (presetKey && THEME_PRESET_PALETTES[presetKey]) {
        Object.entries(THEME_PRESET_PALETTES[presetKey]).forEach(
          ([cssVar, value]) => {
            root.style.setProperty(cssVar, value);
          }
        );
      }
    }, 120);
  }, [settings.themePreset]);

  return (
    <ToastProvider>
      <FeedbackCenterProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Aller au contenu principal
        </a>
        <RouteTransitionLayer>
          <InitializationGate
            theme={theme}
            loadSettings={loadSettings}
            initializeDemoData={initializeDemoDataServices}
          >
            <AppShell theme={theme} toggleTheme={toggleTheme}>
              <RoutesContainer />
            </AppShell>
          </InitializationGate>
        </RouteTransitionLayer>
      </FeedbackCenterProvider>
    </ToastProvider>
  );
}

export default App;
