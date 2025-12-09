import { Suspense, lazy, memo, useDeferredValue } from "react";
import { Routes, Route } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  MOTION_VARIANTS,
  PERFORMANCE_STYLES,
} from "@/utils/performanceOptimizer";
import useDecksService from "@/ui/hooks/useDecksService";
import { SuspenseFallback } from "@/ui/components/feedback/SuspenseFallback";

const HomePage = lazy(() => import("@/ui/pages/HomePage"));
const DecksPage = lazy(() => import("@/ui/pages/DecksPage"));
const StudyPage = lazy(() => import("@/ui/pages/StudyPage"));
const StudyHubPage = lazy(() => import("@/ui/pages/hubs/StudyHubPage"));
const StudyWorkspace = lazy(
  () => import("@/features/study/workspace/StudyWorkspace")
);
const AnalyticsWorkspace = lazy(
  () => import("@/ui/features/analytics/AnalyticsWorkspace")
);
const AgendaPage = lazy(() => import("@/ui/pages/AgendaPage"));
const StatsPage = lazy(() => import("@/ui/pages/StatsPage"));
const SettingsPage = lazy(() => import("@/ui/pages/SettingsPage"));
const MediaArchivePage = lazy(() => import("@/ui/pages/MediaArchivePage"));
const TipsPage = lazy(() =>
  import("@/ui/pages/TipsPage").then((m) => ({ default: m.TipsPage }))
);
const StudyServiceDeckPage = lazy(
  () => import("@/ui/pages/StudyServiceDeckPage")
);
const CustomStudyPage = lazy(() => import("@/ui/pages/CustomStudyPage"));
const CardEditorPage = lazy(() => import("@/ui/pages/CardEditorPage"));
const CreateCardPage = lazy(() => import("@/ui/pages/CreateCardPage"));
const DeckCardsManagerPage = lazy(
  () => import("@/ui/pages/DeckCardsManagerPage")
);
const DebugTestPage = lazy(() => import("@/ui/pages/DebugTestPage"));
const DesignSystemDemo = lazy(() =>
  import("@/ui/pages/DesignSystemDemo").then((m) => ({
    default: m.DesignSystemDemo,
  }))
);

const StudyServicePlaceholder = memo(() => {
  const { decks, loading } = useDecksService();
  const deferredDecks = useDeferredValue(decks);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Mode Étude (Liste Rapide)</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Sélectionnez un deck pour ouvrir la vue liste rapide (création inline +
        navigation clavier) ou basculer en mode session classique.
      </p>
      {loading && <div className="text-sm">Chargement...</div>}
      {!loading && deferredDecks.length === 0 && (
        <div className="text-sm text-gray-500">Aucun deck.</div>
      )}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {deferredDecks.map((d) => (
          <a
            key={d.id}
            href={`/study-service/${d.id}`}
            className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{d.icon || "📚"}</span>
              <span className="font-medium text-gray-800 dark:text-gray-100 truncate">
                {d.name}
              </span>
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">
              {d.totalCards} cartes · {d.masteredCards} maîtrisées
            </div>
          </a>
        ))}
      </div>
    </div>
  );
});

// Optimized route wrapper with concurrent features
const RouteWrapper = memo(
  ({
    children,
    routeKey,
    useTransition = false,
  }: {
    children: React.ReactNode;
    routeKey: string;
    useTransition?: boolean;
  }) => {
    const content = (
      <motion.div
        key={routeKey}
        variants={MOTION_VARIANTS.pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        style={PERFORMANCE_STYLES.base}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    );

    // Use transitions for heavy routes
    if (useTransition) {
      return <Suspense fallback={<SuspenseFallback />}>{content}</Suspense>;
    }

    return content;
  }
);

export function RoutesContainer() {
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          <Route
            path="/study-hub"
            element={
              <RouteWrapper routeKey="study-hub" useTransition>
                <StudyHubPage />
              </RouteWrapper>
            }
          />
          <Route
            path="/workspace/study"
            element={
              <RouteWrapper routeKey="workspace-study" useTransition>
                <StudyWorkspace />
              </RouteWrapper>
            }
          />
          <Route
            path="/workspace/analytics"
            element={
              <RouteWrapper routeKey="workspace-analytics" useTransition>
                <AnalyticsWorkspace />
              </RouteWrapper>
            }
          />
          <Route
            path="/deck/:deckId/cards"
            element={
              <RouteWrapper routeKey="deck-cards-manager">
                <DeckCardsManagerPage />
              </RouteWrapper>
            }
          />
          <Route
            path="/"
            element={
              <RouteWrapper routeKey="home">
                <HomePage />
              </RouteWrapper>
            }
          />
          <Route
            path="/decks"
            element={
              <RouteWrapper routeKey="decks">
                <DecksPage />
              </RouteWrapper>
            }
          />
          <Route
            path="/study/:deckId"
            element={
              <RouteWrapper routeKey="study" useTransition>
                <StudyPage />
              </RouteWrapper>
            }
          />
          <Route
            path="/study"
            element={
              <RouteWrapper routeKey="study-generic" useTransition>
                <StudyPage />
              </RouteWrapper>
            }
          />
          <Route
            path="/study-custom"
            element={
              <RouteWrapper routeKey="study-custom" useTransition>
                <CustomStudyPage />
              </RouteWrapper>
            }
          />
          <Route
            path="/stats"
            element={
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <StatsPage />
              </motion.div>
            }
          />
          <Route
            path="/settings"
            element={
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SettingsPage />
              </motion.div>
            }
          />
          <Route
            path="/tips"
            element={
              <motion.div
                key="tips"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TipsPage />
              </motion.div>
            }
          />
          <Route
            path="/create"
            element={
              <motion.div
                key="create-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CreateCardPage />
              </motion.div>
            }
          />
          <Route
            path="/card-editor/:deckId"
            element={
              <motion.div
                key="card-editor"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CardEditorPage />
              </motion.div>
            }
          />
          <Route
            path="/debug-test"
            element={
              <RouteWrapper routeKey="debug-test">
                <DebugTestPage />
              </RouteWrapper>
            }
          />
          <Route
            path="/design-system-demo"
            element={
              <RouteWrapper routeKey="design-system-demo">
                <DesignSystemDemo />
              </RouteWrapper>
            }
          />
          <Route
            path="/agenda"
            element={
              <RouteWrapper routeKey="agenda">
                <AgendaPage />
              </RouteWrapper>
            }
          />
          <Route
            path="/media-archive"
            element={
              <RouteWrapper routeKey="media-archive" useTransition>
                <MediaArchivePage />
              </RouteWrapper>
            }
          />
          <Route
            path="/study-service"
            element={
              <RouteWrapper routeKey="study-service">
                <StudyServicePlaceholder />
              </RouteWrapper>
            }
          />
          <Route
            path="/study-service/:deckId"
            element={
              <RouteWrapper routeKey="study-service-deck" useTransition>
                <StudyServiceDeckPage />
              </RouteWrapper>
            }
          />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}
