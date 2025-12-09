import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useDecksService from "@/ui/hooks/useDecksService";
import { container } from "@/application/Container";
import {
  DECK_SERVICE_TOKEN,
  DeckService,
} from "@/application/services/DeckService";
import {
  CARD_SERVICE_TOKEN,
  CardService,
} from "@/application/services/CardService";
import WorkspaceGlassLayout from "@/ui/components/layout/WorkspaceGlassLayout";
import { useFeedback } from "@/ui/components/feedback/useFeedback";
import Icons from "@/ui/components/common/Icons";
import { Button } from "@/ui/components/common/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/ui/components/common/Card";
import { typography } from "@/ui/design/typography";
import { cn } from "@/utils/cn";
import {
  DeckExportService,
  DECK_EXPORT_SERVICE_TOKEN,
} from "@/application/services/DeckExportService";
import { importDeckMultiFormat } from "@/application/import/deckMultiFormatImport";

const DecksPage: React.FC = () => {
  const navigate = useNavigate();
  const { decks, loading, error, refresh } = useDecksService();
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsCount, setCardsCount] = useState(0);
  useEffect(() => {
    (async () => {
      try {
        setCardsLoading(true);
        let total = 0;
        try {
          const cardSvc = container.resolve<CardService>(CARD_SERVICE_TOKEN);
          total = await cardSvc.countAll();
        } catch {
          /* repo may not support yet */
        }
        setCardsCount(total);
      } finally {
        setCardsLoading(false);
      }
    })();
  }, []);
  const { play } = useFeedback();
  const [importing, setImporting] = useState(false);
  const [exportingDeckId, setExportingDeckId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDescription, setNewDeckDescription] = useState("");

  const handleDeckClick = (deck: any) => {
    play("click");
    navigate(`/deck/${deck.id}/cards`);
  };
  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;
    const svc = container.resolve<DeckService>(DECK_SERVICE_TOKEN);
    await svc.createDeck({
      name: newDeckName.trim(),
      description: newDeckDescription.trim(),
      color: "#3B82F6",
      icon: "decks",
      tags: [],
      isPublic: false,
    });
    setShowCreateModal(false);
    setNewDeckName("");
    setNewDeckDescription("");
    refresh();
  };

  const handleExportDeck = async (deckId: string, deckName: string) => {
    try {
      setExportingDeckId(deckId);
      const svc = container.resolve<DeckExportService>(
        DECK_EXPORT_SERVICE_TOKEN
      );
      const exported = await svc.exportDeck(deckId);
      if (!exported) return;
      const blob = new Blob([JSON.stringify(exported, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${deckName || "deck"}-ariba.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      play("success");
    } catch {
      // feedback minimal, rester léger
    } finally {
      setExportingDeckId(null);
    }
  };

  const handleImportDeck = async (file: File) => {
    try {
      setImporting(true);
      const result = await importDeckMultiFormat(file, {
        deckName: file.name.replace(/\.[^.]+$/, ""),
      });
      if (result.cards.length > 0) {
        play("success");
      } else {
        play("error");
      }
      await refresh();
    } catch {
      play("error");
    } finally {
      setImporting(false);
    }
  };

  const animatedDecks = useMemo(() => decks, [decks]);

  const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { delay: i * 0.045, duration: 0.5, ease: "easeOut" },
    }),
    exit: { opacity: 0, y: -10, scale: 0.9, transition: { duration: 0.25 } },
  };

  return (
    <WorkspaceGlassLayout>
      <div className="relative">
          <div className="mb-10 text-center">
            <motion.h1
              className={cn(
                typography.display.md,
                "mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[var(--dyn-accent)] via-fuchsia-500 to-[var(--dyn-accent-soft)] drop-shadow flex items-center justify-center gap-3"
              )}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Icons.Decks size="lg" />
              <span>Mes Paquets</span>
            </motion.h1>
            <motion.p
              className={cn(
                typography.body.large,
                "text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              Gérez, organisez et explorez vos collections de cartes optimisées
              par l'IA (SM‑2 & Learning System)
            </motion.p>
          </div>
          {(loading || cardsLoading) && (
            <div className="flex items-center gap-3 mb-4 text-xs">
              {loading && (
                <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 animate-pulse">
                  Decks...
                </span>
              )}
              {cardsLoading && (
                <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 animate-pulse">
                  Cartes...
                </span>
              )}
            </div>
          )}
          {!loading && !cardsLoading && (
            <div className="flex items-center gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">
                {decks.length} decks
              </span>
              <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">
                {cardsCount > 0 ? cardsCount : "—"} cartes
              </span>
            </div>
          )}
          {error && <div className="text-sm text-red-500 mb-4">{error}</div>}
          {!loading && decks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card variant="elevated" className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-fuchsia-500/5 to-purple-600/5 opacity-0 hover:opacity-100 transition-opacity" />
                <CardContent className="text-center py-14 relative z-10">
                  <div className="text-7xl mb-4 animate-pulse flex justify-center">
                    <Icons.Decks size="xl" />
                  </div>
                  <h3
                    className={cn(
                      typography.heading.h3,
                      "text-gray-900 dark:text-white mb-2"
                    )}
                  >
                    Aucun paquet trouvé
                  </h3>
                  <p
                    className={cn(
                      typography.body.base,
                      "text-gray-600 dark:text-gray-400 mb-6"
                    )}
                  >
                    Cliquez sur le bouton ci-dessous pour créer votre premier
                    paquet. Des données de démo devraient aussi s'initialiser
                    automatiquement.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    leftIcon={<Icons.Zap size="sm" />}
                  >
                    Créer un paquet
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <AnimatePresence mode="sync">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {animatedDecks.map((deck, i) => (
                  <motion.div
                    layout
                    key={deck.id}
                    custom={i}
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="h-full"
                  >
                    <Card
                      variant="glass"
                      hover="lift"
                      onClick={() => handleDeckClick(deck)}
                      className="h-full relative group overflow-hidden"
                      style={{ "--deck-color": deck.color } as any}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-[var(--dyn-accent-soft,rgba(99,102,241,0.15))] via-fuchsia-500/10 to-purple-600/20" />
                      <CardContent className="relative z-10 p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl drop-shadow-sm">
                              {deck.icon || "📘"}
                            </span>
                            <h3
                              className={cn(
                                typography.heading.h4,
                                "tracking-tight group-hover:text-[var(--dyn-accent)] transition-colors"
                              )}
                            >
                              {deck.name}
                            </h3>
                          </div>
                          <span
                            className="w-3.5 h-3.5 rounded-full ring-2 ring-white/60 dark:ring-gray-900/60 shadow"
                            style={{ backgroundColor: deck.color }}
                          />
                        </div>
                        <p
                          className={cn(
                            typography.body.base,
                            "text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 min-h-[48px]"
                          )}
                        >
                          {deck.description || "Aucune description"}
                        </p>
                        <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                          <span>{deck.totalCards} cartes</span>
                          <span>{deck.masteredCards} maîtrisées</span>
                        </div>
                      </CardContent>
                      <CardFooter className="gap-2 mt-auto p-5 pt-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            play("click");
                            navigate(`/deck/${deck.id}/cards`);
                          }}
                          leftIcon={<Icons.Folder size="sm" />}
                        >
                          Cartes
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            play("success");
                            navigate(`/workspace/study?deck=${deck.id}`);
                          }}
                          leftIcon={<Icons.Zap size="sm" />}
                        >
                          Étudier
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportDeck(deck.id, deck.name);
                          }}
                          leftIcon={<Icons.Download size="sm" />}
                        >
                          {exportingDeckId === deck.id
                            ? "Export..."
                            : "Exporter"}
                        </Button>
                      </CardFooter>
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-[var(--dyn-accent-soft,rgba(99,102,241,0.15))] blur-2xl opacity-40 group-hover:opacity-70 transition-opacity" />
                    </Card>
                  </motion.div>
                ))}
                <motion.div
                  key="add-card"
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full"
                >
                  <Card
                    variant="outline"
                    hover="scale"
                    className="h-full border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-[var(--dyn-accent)] dark:hover:border-[var(--dyn-accent)] cursor-pointer min-h-[230px] flex flex-col items-center justify-center text-center"
                    onClick={() => {
                      setShowCreateModal(true);
                      play("click");
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-[var(--dyn-accent-soft,rgba(99,102,241,0.15))] to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                    <CardContent className="relative z-10">
                      <div className="mb-3 text-gray-400 group-hover:text-[var(--dyn-accent)] transition-colors flex justify-center">
                        <Icons.Add size="xl" />
                      </div>
                      <h3
                        className={cn(
                          typography.heading.h4,
                          "text-gray-600 dark:text-gray-300 group-hover:text-[var(--dyn-accent)] transition-colors"
                        )}
                      >
                        Nouveau paquet
                      </h3>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </AnimatePresence>
          )}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md mx-4"
              >
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>Créer un nouveau paquet</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label
                        className={cn(typography.label.base, "block mb-2")}
                      >
                        Nom du paquet
                      </label>
                      <input
                        type="text"
                        value={newDeckName}
                        onChange={(e) => setNewDeckName(e.target.value)}
                        placeholder="Ex: Vocabulaire Anglais"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label
                        className={cn(typography.label.base, "block mb-2")}
                      >
                        Description (optionnelle)
                      </label>
                      <textarea
                        value={newDeckDescription}
                        onChange={(e) => setNewDeckDescription(e.target.value)}
                        rows={3}
                        placeholder="Décrivez le contenu de ce paquet..."
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end space-x-3">
                    <Button
                      variant="ghost"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleCreateDeck}
                      disabled={!newDeckName.trim()}
                    >
                      Créer le paquet
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
        {/* FABs */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
          <input
            id="deck-import-input"
            type="file"
            accept=".txt,.csv,.json,.apkg,.pdf,.xlsx,.zip"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void handleImportDeck(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="shadow-lg rounded-full h-14 w-14 bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition"
            title="Créer un paquet"
          >
            <Icons.Decks size="md" />
          </button>
          <button
            onClick={() => {
              const input = document.getElementById(
                "deck-import-input"
              ) as HTMLInputElement | null;
              input?.click();
            }}
            className="shadow-lg rounded-full h-14 w-14 bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition disabled:opacity-60"
            title={importing ? "Import en cours..." : "Importer un paquet"}
            disabled={importing}
          >
            <Icons.Upload size="md" />
          </button>
          {decks.length > 0 && (
            <button
              onClick={() => navigate("/create")}
              className="shadow-lg rounded-full h-14 w-14 bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition"
              title="Créer une carte"
            >
              <Icons.Add size="lg" />
            </button>
          )}
        </div>
      </div>
    </WorkspaceGlassLayout>
  );
};

export default DecksPage;
