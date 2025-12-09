import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DemoCard } from "@/ui/components/Card/DemoCard";
import Icons from "@/ui/components/common/Icons";
import { Button } from "@/ui/components/common/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/components/common/Card";
import { typography } from "@/ui/design/typography";
import { cn } from "@/utils/cn";
import useDecksService from "@/ui/hooks/useDecksService";
import { getHeroTransition } from "@/ui/styles/motionProfiles";

const HomePage = () => {
  const navigate = useNavigate();
  const { decks, loading } = useDecksService();
  const recent = [...decks]
    .sort((a: any, b: any) => (b.lastStudied || 0) - (a.lastStudied || 0))
    .slice(0, 3);

  const handleStartLearning = () => {
    navigate("/study");
  };

  const handleExploreDecks = () => {
    navigate("/decks");
  };

  const demoCard = { frontText: "Hello", backText: "Bonjour / Salut" };
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-rose-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-6xl">
        <div
          className="absolute -inset-1 rounded-[32px] bg-gradient-to-tr from-sky-400/40 via-fuchsia-500/30 to-amber-400/40 blur-2xl opacity-60 dark:opacity-40"
          aria-hidden
        />
        <div className="relative rounded-[32px] bg-white/90 dark:bg-slate-950/85 border border-white/60 dark:border-slate-800 shadow-[0_30px_120px_rgba(15,23,42,0.45)] backdrop-blur-2xl overflow-hidden">
          <div className="grid grid-cols-[minmax(0,260px)_minmax(0,1fr)] min-h-[520px]">
            {/* Sidebar gauche */}
            <motion.aside
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={getHeroTransition(0)}
              className="border-r border-slate-100/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/70 px-6 py-6 flex flex-col gap-6"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                    C
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Workspace
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      Cards Studio
                    </div>
                  </div>
                </div>
              </div>
              <nav className="space-y-3 text-sm">
                <div className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">
                  Principal
                </div>
                <button
                  type="button"
                  onClick={handleStartLearning}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-900 text-slate-50 text-xs font-medium shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <Icons.Study size="sm" />
                    Session d'étude
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50/10">
                    Espace
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleExploreDecks}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl text-xs text-slate-600 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                >
                  <Icons.Decks size="sm" />
                  Gérer les paquets
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/study-hub")}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl text-xs text-slate-600 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                >
                  <Icons.Target size="sm" />
                  Hub d'apprentissage
                </button>
              </nav>
              <div className="mt-auto space-y-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Icons.Stats size="xs" />
                    Aujourd'hui
                  </span>
                  <span className="font-medium">{decks.length} paquets</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Icons.Zap size="xs" />
                    Mode IA
                  </span>
                  <span className="text-emerald-500 font-medium">Actif</span>
                </div>
              </div>
            </motion.aside>

            {/* Canvas principal */}
            <motion.main
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={getHeroTransition(0.1)}
              className="relative px-6 py-6 sm:px-8 sm:py-8 bg-gradient-to-b from-white/90 via-white/80 to-slate-50/80 dark:from-slate-950/90 dark:via-slate-950/95 dark:to-slate-950/90"
            >
              <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h1
                    className={cn(
                      typography.display.md,
                      "mb-2 text-slate-900 dark:text-slate-50"
                    )}
                  >
                    Tableau d'étude
                  </h1>
                  <p
                    className={cn(
                      typography.body.small,
                      "text-slate-500 dark:text-slate-400 max-w-md"
                    )}
                  >
                    Retrouver vos derniers paquets, statistiques et une carte de
                    démonstration dans un espace calme.
                  </p>
                </div>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    type="button"
                    className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-950/40"
                  >
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Systèmes IA opérationnels
                  </button>
                </div>
              </header>

              {/* Grille de cartes type board */}
              <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3 mb-6">
                <Card className="rounded-3xl bg-sky-50 border-sky-100 text-slate-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-white text-xs shadow-sm">
                        🧠
                      </span>
                      Lecture active
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs text-slate-600 space-y-2">
                    <p>
                      Reprise intelligente de vos cartes en tenant compte de
                      votre profil.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 py-1 h-7 text-[11px] font-medium text-sky-700 hover:text-sky-900"
                      onClick={handleStartLearning}
                    >
                      Démarrer une session
                    </Button>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl bg-emerald-50 border-emerald-100 text-slate-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs shadow-sm">
                        📊
                      </span>
                      Statistiques rapides
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs text-slate-600 space-y-1">
                    <p>{decks.length} paquets au total.</p>
                    <p>
                      {recent.length > 0
                        ? "Des paquets prêts à être repris aujourd'hui."
                        : "Créez un premier paquet pour commencer."}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl bg-amber-50 border-amber-100 text-slate-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-white text-xs shadow-sm">
                        ✏️
                      </span>
                      Création rapide
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs text-slate-600 space-y-2">
                    <p>Aller directement à la gestion de vos paquets.</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 py-1 h-7 text-[11px] font-medium text-amber-700 hover:text-amber-900"
                      onClick={handleExploreDecks}
                    >
                      Ouvrir la bibliothèque
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Ligne du bas : récents + carte demo */}
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
                {!loading && recent.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={getHeroTransition(0.2)}
                    className="space-y-3"
                  >
                    <h2
                      className={cn(
                        typography.heading.h4,
                        "text-slate-900 dark:text-slate-50 flex items-center gap-2"
                      )}
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-slate-50 text-xs">
                        ↺
                      </span>
                      Reprendre l'apprentissage
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {recent.map((deck: any) => (
                        <Card
                          key={deck.id}
                          className="rounded-2xl border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all"
                          onClick={() => navigate(`/study/${deck.id}`)}
                        >
                          <CardHeader className="pb-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-2xl">
                                {deck.icon || "📚"}
                              </span>
                              {deck.newCards > 0 && (
                                <span className="bg-sky-100 text-sky-800 text-[10px] font-medium px-2 py-0.5 rounded-full dark:bg-sky-900 dark:text-sky-200">
                                  {deck.newCards} nouveaux
                                </span>
                              )}
                            </div>
                            <CardTitle className="text-sm truncate">
                              {deck.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px]">
                              {deck.description || "Aucune description"}
                            </p>
                            <div className="mt-2 flex items-center text-[11px] text-sky-700 dark:text-sky-300 font-medium">
                              <span>Étudier maintenant</span>
                              <Icons.ChevronRight size="xs" className="ml-1" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </motion.section>
                )}

                <motion.section
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={getHeroTransition(0.25)}
                  className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 px-4 py-4 flex flex-col gap-3"
                >
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">
                      Carte flash interactive
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Cliquez pour voir le comportement des cartes 3D.
                    </p>
                  </div>
                  <div className="max-w-xs mx-auto w-full">
                    <DemoCard
                      frontText={demoCard.frontText}
                      backText={demoCard.backText}
                    />
                  </div>
                </motion.section>
              </div>
            </motion.main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
