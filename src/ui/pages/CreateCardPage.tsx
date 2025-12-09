import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { container } from "@/application/Container";
import {
  DECK_SERVICE_TOKEN,
  DeckService,
} from "@/application/services/DeckService";
import {
  CARD_SERVICE_TOKEN,
  CardService,
} from "@/application/services/CardService";
import { Button } from "@/ui/components/common/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/components/common/Card";
import { typography } from "@/ui/design/typography";
import { cn } from "@/utils/cn";

// Lazy load de l'éditeur riche pour accélérer le premier rendu global
const UltraRichTextEditor = lazy(
  () => import("@/ui/components/Editor/UltraRichTextEditor")
);

interface SelectableDeck {
  id: string;
  name: string;
}

export default function CreateCardPage() {
  const navigate = useNavigate();
  const deckService = container.resolve<DeckService>(DECK_SERVICE_TOKEN);
  const cardService = container.resolve<CardService>(CARD_SERVICE_TOKEN);
  const [decks, setDecks] = useState<SelectableDeck[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [deckId, setDeckId] = useState("");
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [tags, setTags] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [saving, setSaving] = useState(false);
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDescription, setNewDeckDescription] = useState("");
  const [creatingDeck, setCreatingDeck] = useState(false);
  const canSave = deckId && frontText.trim() && backText.trim() && !saving;

  useEffect(() => {
    (async () => {
      try {
        setLoadingDecks(true);
        const list = await deckService.listDecks();
        setDecks(list.map((d) => ({ id: d.id, name: d.name })));
        if (list.length && !deckId) setDeckId(list[0].id);
      } finally {
        setLoadingDecks(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await cardService.create(deckId, {
        frontText: frontText.trim(),
        backText: backText.trim(),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        difficulty,
      });
      // Redirection vers la vue liste rapide (deck) après sauvegarde
      navigate(`/study-service/${deckId}`);
    } finally {
      setSaving(false);
    }
  }, [
    canSave,
    cardService,
    deckId,
    frontText,
    backText,
    tags,
    difficulty,
    navigate,
  ]);

  // Raccourci Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!saving) void save();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save, saving]);

  const createDeck = async () => {
    if (!newDeckName.trim()) return;
    setCreatingDeck(true);
    try {
      const deck = await deckService.createDeck({
        name: newDeckName.trim(),
        description: newDeckDescription.trim(),
        color: "#3B82F6",
        icon: "decks",
        tags: [],
        isPublic: false,
      });
      setDecks((prev) => [...prev, { id: deck.id, name: deck.name }]);
      setDeckId(deck.id);
      setShowCreateDeck(false);
      setNewDeckName("");
      setNewDeckDescription("");
    } finally {
      setCreatingDeck(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" dir="ltr">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className={typography.heading.h2}>Créer une carte</h1>
            <p
              className={cn(
                typography.body.base,
                "text-gray-500 dark:text-gray-400"
              )}
            >
              Rédigez le recto / verso, choisissez un paquet puis enregistrez.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Retour
            </Button>
            <Button
              variant="primary"
              onClick={save}
              disabled={!canSave}
              isLoading={saving}
            >
              Enregistrer
            </Button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Suspense
              fallback={
                <div className="h-[600px] flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 border rounded bg-white/40 dark:bg-gray-800/40 animate-pulse">
                  Chargement éditeur…
                </div>
              }
            >
              <UltraRichTextEditor
                value={frontText}
                onChange={setFrontText}
                backValue={backText}
                onBackChange={setBackText}
                placeholder="Recto..."
                backPlaceholder="Verso..."
                height="400px"
              />
            </Suspense>
          </div>
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Paquet
                  </label>
                  {loadingDecks ? (
                    <div className="text-xs text-gray-500 animate-pulse">
                      Chargement...
                    </div>
                  ) : (
                    <select
                      value={deckId}
                      onChange={(e) => setDeckId(e.target.value)}
                      className="input"
                    >
                      {decks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                      {decks.length === 0 && (
                        <option value="" disabled>
                          Aucun paquet
                        </option>
                      )}
                    </select>
                  )}
                  {decks.length === 0 && !loadingDecks && (
                    <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex flex-col gap-2">
                      <span>Aucun paquet disponible.</span>
                      <button
                        type="button"
                        onClick={() => setShowCreateDeck(true)}
                        className="px-2 py-1 text-[11px] rounded bg-blue-600 text-white hover:bg-blue-500 w-fit"
                      >
                        Créer un paquet
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tags</label>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="concept, formule"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Difficulté
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="input"
                  >
                    <option value={1}>1 - Très facile</option>
                    <option value={2}>2 - Facile</option>
                    <option value={3}>3 - Moyen</option>
                    <option value={4}>4 - Difficile</option>
                    <option value={5}>5 - Très difficile</option>
                  </select>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  L'intervalle initial sera ajusté par l'algorithme adaptatif
                  après vos retours.
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Raccourcis</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc pl-4 space-y-1">
                  <li>Ctrl+S pour enregistrer (bientôt)</li>
                  <li>Utilisez , pour séparer les tags</li>
                  <li>
                    Le moteur SM-2 amélioré ajuste la prochaine révision
                    automatiquement
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {showCreateDeck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>Nouveau paquet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Nom</label>
                  <input
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    className="input"
                    placeholder="Ex: Biologie"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={newDeckDescription}
                    onChange={(e) => setNewDeckDescription(e.target.value)}
                    className="input min-h-[80px]"
                    placeholder="Résumé du contenu"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateDeck(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!newDeckName.trim() || creatingDeck}
                  onClick={createDeck}
                  isLoading={creatingDeck}
                >
                  Créer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
