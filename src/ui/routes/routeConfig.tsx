import type { RouteCategory } from "@/ui/design/tokens";
import type { ReactNode } from "react";
import Icons from "@/ui/components/common/Icons";

// Phase 1: centralisation métadonnées routes (navigation, regroupement, future analytics / A/B).

export interface AppRouteMeta {
  id: string;
  path: string;
  label: string;
  icon: ReactNode; // ✨ Changé de string à ReactNode pour supporter les composants
  category: RouteCategory;
  element: React.ComponentType<any>;
  legacy?: boolean;
  order?: number;
}

import HomePage from "@/ui/pages/HomePageOptimized";
import DecksPage from "@/ui/pages/DecksPage";
import StudyPage from "@/ui/pages/StudyPage";
import StudyServiceDeckPage from "@/ui/pages/StudyServiceDeckPage";
import CardEditorPage from "@/ui/pages/CardEditorPage";
import CreateCardPage from "@/ui/pages/CreateCardPage";
import StatsPage from "@/ui/pages/StatsPage";
import MediaArchivePage from "@/ui/pages/MediaArchivePage";
import AgendaPage from "@/ui/pages/AgendaPage";
import SettingsPage from "@/ui/pages/SettingsPage";
import { TipsPage } from "@/ui/pages/TipsPage";
import DebugTestPage from "@/ui/pages/DebugTestPage";
import StudyHubPage from "@/ui/pages/hubs/StudyHubPage";
import StudyWorkspace from "@/features/study/workspace/StudyWorkspace";
import AnalyticsWorkspace from "@/ui/features/analytics/AnalyticsWorkspace";
import { DesignSystemDemo } from "@/ui/pages/DesignSystemDemo";

export const appRoutes: AppRouteMeta[] = [
  // 🏠 ACCUEIL
  {
    id: "home",
    path: "/",
    label: "Accueil",
    icon: <Icons.Home size="md" />,
    category: "organize",
    element: HomePage,
    order: 0,
  },

  // 📚 ÉTUDE - Tout ce qui concerne l'apprentissage actif
  {
    id: "study-service",
    path: "/study-service",
    label: "Session d'étude",
    icon: <Icons.Zap size="md" />,
    category: "learn",
    element: StudyServiceDeckPage,
    order: 0,
  },
  {
    id: "study-workspace",
    path: "/workspace/study",
    label: "Tableau de bord",
    icon: <Icons.Target size="md" />,
    category: "learn",
    element: StudyWorkspace,
    order: 1,
  },
  {
    id: "study-hub",
    path: "/study-hub",
    label: "Centre d'apprentissage",
    icon: <Icons.Study size="md" />,
    category: "learn",
    element: StudyHubPage,
    order: 2,
  },

  // 📦 CONTENU - Gestion des decks et cartes
  {
    id: "decks",
    path: "/decks",
    label: "Mes paquets",
    icon: <Icons.Decks size="md" />,
    category: "organize",
    element: DecksPage,
    order: 1,
  },
  {
    id: "create-card",
    path: "/create",
    label: "Nouvelle carte",
    icon: <Icons.Edit size="md" />,
    category: "organize",
    element: CreateCardPage,
    order: 2,
  },
  {
    id: "media-archive",
    path: "/media-archive",
    label: "Bibliothèque médias",
    icon: <Icons.Image size="md" />,
    category: "organize",
    element: MediaArchivePage,
    order: 3,
  },

  // 📊 PROGRESSION - Stats et analytics
  {
    id: "stats",
    path: "/stats",
    label: "Mes statistiques",
    icon: <Icons.Stats size="md" />,
    category: "analyze",
    element: StatsPage,
    order: 0,
  },
  {
    id: "analytics-workspace",
    path: "/workspace/analytics",
    label: "Tableau analytique",
    icon: <Icons.TrendUp size="md" />,
    category: "analyze",
    element: AnalyticsWorkspace,
    order: 1,
  },
  {
    id: "agenda",
    path: "/agenda",
    label: "Planning & Révisions",
    icon: <Icons.Calendar size="md" />,
    category: "analyze",
    element: AgendaPage,
    order: 2,
  },

  // 🤖 ASSISTANT IA - Outils intelligents
  {
    id: "tips",
    path: "/tips",
    label: "Assistant IA",
    icon: <Icons.Info size="md" />,
    category: "create",
    element: TipsPage,
    order: 0,
  },

  // ⚙️ SYSTÈME - Config et paramètres
  {
    id: "settings",
    path: "/settings",
    label: "Paramètres",
    icon: <Icons.Settings size="md" />,
    category: "system",
    element: SettingsPage,
    order: 0,
  },
  {
    id: "design-system-demo",
    path: "/design-system-demo",
    label: "Design System",
    icon: <Icons.Info size="md" />,
    category: "system",
    element: DesignSystemDemo,
    order: 1,
  },
  {
    id: "debug-test",
    path: "/debug-test",
    label: "Outils développeur",
    icon: <Icons.Settings size="md" />,
    category: "system",
    element: DebugTestPage,
    order: 2,
  },

  // Routes cachées (paramètres dynamiques)
  {
    id: "card-editor",
    path: "/card-editor/:deckId",
    label: "Éditer carte",
    icon: <Icons.File size="md" />,
    category: "create",
    element: CardEditorPage,
    order: 99,
  },
  {
    id: "study",
    path: "/study",
    label: "Étude (legacy)",
    icon: <Icons.Folder size="md" />,
    category: "system",
    element: StudyPage,
    legacy: true,
    order: 99,
  },
];

export const groupedRoutes = ((): Record<string, AppRouteMeta[]> => {
  return appRoutes.reduce((acc, r) => {
    acc[r.category] = acc[r.category] || [];
    acc[r.category].push(r);
    acc[r.category].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return acc;
  }, {} as Record<string, AppRouteMeta[]>);
})();

export const primaryNavigationOrder: RouteCategory[] = [
  "learn",
  "organize",
  "analyze",
  "create",
  "system",
];
