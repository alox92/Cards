import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { container } from "@/application/Container";
import {
  DECK_SERVICE_TOKEN,
  DeckService,
} from "@/application/services/DeckService";
import {
  CARD_SERVICE_TOKEN,
  CardService,
} from "@/application/services/CardService";
import type { CardEntity } from "@/domain/entities/Card";
import { Button } from "@/ui/components/common/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/components/common/Card";
import { typography } from "@/ui/design/typography";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import Icons from "@/ui/components/common/Icons";

interface EditableCardState {
  id: string;
  entity: CardEntity;
  __editing?: boolean;
  __dirtyFront?: string;
  __dirtyBack?: string;
  __dirtyTags?: string;
}

export default function DeckCardsManagerPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const deckService = container.resolve<DeckService>(DECK_SERVICE_TOKEN);
  const cardService = container.resolve<CardService>(CARD_SERVICE_TOKEN);
  const [deckName, setDeckName] = useState("");
  const [cards, setCards] = useState<EditableCardState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [filter, setFilter] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    (async () => {
      if (!deckId) return;
      try {
        setLoading(true);
        setError(null);
        const deck = await deckService.getDeck(deckId);
        if (deck) setDeckName(deck.name);
        const list = await cardService.listByDeck(deckId);
        list.sort((a, b) => (a.sortIndex || 0) - (b.sortIndex || 0));
        setCards(list.map((c) => ({ id: c.id, entity: c })));
      } catch (e: any) {
        setError(e.message || "Erreur chargement deck");
      } finally {
        setLoading(false);
      }
    })();
  }, [deckId]);

  const filtered = useMemo(
    () =>
      cards.filter(
        (c) =>
          !filter.trim() ||
          c.entity.frontText.toLowerCase().includes(filter.toLowerCase()) ||
          c.entity.backText.toLowerCase().includes(filter.toLowerCase())
      ),
    [cards, filter]
  );

  async function createCard() {
    if (!deckId || !newFront.trim() || !newBack.trim()) return;
    setCreating(true);
    try {
      const card = await cardService.create(deckId, {
        frontText: newFront.trim(),
        backText: newBack.trim(),
        tags: [],
        favorite: false,
      } as any);
      setCards((prev) =>
        [...prev, { id: card.id, entity: card }].sort(
          (a, b) => (a.entity.sortIndex || 0) - (b.entity.sortIndex || 0)
        )
      );
      setNewFront("");
      setNewBack("");
    } catch (e: any) {
      setError(e.message || "Erreur création carte");
    } finally {
      setCreating(false);
    }
  }

  function toggleEdit(id: string) {
    setCards((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              __editing: !c.__editing,
              __dirtyFront: c.entity.frontText,
              __dirtyBack: c.entity.backText,
              __dirtyTags: c.entity.tags.join(", "),
            }
          : c
      )
    );
  }

  async function saveEdit(id: string) {
    const target = cards.find((c) => c.id === id);
    if (!target) return;
    try {
      target.entity.update({
        frontText: target.__dirtyFront,
        backText: target.__dirtyBack,
        tags: (target.__dirtyTags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      await cardService.update(target.entity);
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { id, entity: target.entity } : c))
      );
    } catch (e: any) {
      setError(e.message || "Erreur sauvegarde");
    }
  }

  async function deleteCard(id: string) {
    if (!confirm("Supprimer cette carte ?")) return;
    try {
      await cardService.delete(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      setError(e.message || "Erreur suppression");
    }
  }

  function move(id: string, dir: -1 | 1) {
    setCards((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx < 0) return prev;
      const copy = [...prev];
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= copy.length) return prev;
      const [it] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, it);
      copy.forEach((c, i) => {
        c.entity.sortIndex = i + 1;
      });
      return [...copy];
    });
  }

  async function persistOrder() {
    if (savingOrder) return;
    setSavingOrder(true);
    try {
      for (const c of cards) {
        await cardService.update(c.entity);
      }
    } finally {
      setSavingOrder(false);
    }
  }

  async function toggleFavorite(id: string) {
    const target = cards.find((c) => c.id === id);
    if (!target) return;
    target.entity.favorite = !target.entity.favorite;
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c } : c)));
    await cardService.update(target.entity);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-500 to-cyan-500 shadow-lg flex items-center justify-center text-white font-semibold">
                <Icons.Folder size="lg" />
              </div>
              <div>
                <h1 className={typography.heading.h2}>Cartes du Paquet</h1>
                <p
                  className={cn(
                    typography.body.base,
                    "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {deckName || deckId} · {cards.length} cartes
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/workspace/study?deck=${deckId}`)}
            >
              <Icons.Zap size="sm" className="mr-2" />
              Étudier
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={savingOrder}
              onClick={persistOrder}
              isLoading={savingOrder}
            >
              <Icons.Save size="sm" className="mr-2" />
              Sauver ordre
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <Icons.ChevronLeft size="sm" className="mr-2" />
              Retour
            </Button>
          </div>
        </div>

        {/* Outils / Filtres */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="col-span-2 flex gap-3">
            <div className="flex-1 relative">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtrer (recto, verso, tag)..."
                className="w-full h-11 px-4 rounded-xl bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 backdrop-blur text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>
          <div className="hidden md:flex justify-end items-center text-[11px] text-gray-400">
            <span>⏎ Enter pour ajouter · Éditer inline · ↑↓ pour ordre</span>
          </div>
        </div>

        {/* Création rapide */}
        <Card className="p-5 flex flex-col lg:flex-row gap-3">
          <div className="flex-1 flex flex-col md:flex-row gap-3">
            <input
              value={newFront}
              onChange={(e) => setNewFront(e.target.value)}
              placeholder="Recto (question)"
              className="flex-1 h-11 px-4 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <input
              value={newBack}
              onChange={(e) => setNewBack(e.target.value)}
              placeholder="Verso (réponse)"
              className="flex-1 h-11 px-4 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-stretch gap-3">
            <Button
              variant="primary"
              className="h-11"
              disabled={!newFront.trim() || !newBack.trim() || creating}
              onClick={createCard}
              isLoading={creating}
            >
              Ajouter
            </Button>
          </div>
        </Card>

        {error && <div className="text-xs text-red-500">{error}</div>}
        {loading && <div className="text-sm text-gray-500">Chargement…</div>}

        {/* Tableau */}
        {!loading && (
          <Card className="overflow-hidden">
            <div className="overflow-auto max-h-[65vh] custom-scroll">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50/90 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="p-3 text-left w-10 font-semibold">#</th>
                    <th className="p-3 text-left font-semibold min-w-[180px]">
                      Recto
                    </th>
                    <th className="p-3 text-left font-semibold min-w-[180px]">
                      Verso
                    </th>
                    <th className="p-3 text-left font-semibold w-48">Tags</th>
                    <th className="p-3 text-left font-semibold w-24">Succès</th>
                    <th className="p-3 text-left font-semibold w-20">Favori</th>
                    <th className="p-3 text-left font-semibold w-64">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b border-gray-100/60 dark:border-gray-700/50 odd:bg-white/40 even:bg-gray-50/40 dark:odd:bg-gray-800/40 dark:even:bg-gray-850/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors group align-top"
                    >
                      <td className="p-3 text-[11px] text-gray-400 tabular-nums align-top w-10">
                        {i + 1}
                      </td>
                      <td className="p-3 align-top">
                        {!c.__editing && (
                          <div className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-100 leading-snug text-[13px] max-w-xs">
                            {c.entity.frontText}
                          </div>
                        )}
                        {c.__editing && (
                          <textarea
                            value={c.__dirtyFront}
                            onChange={(e) =>
                              setCards((prev) =>
                                prev.map((x) =>
                                  x.id === c.id
                                    ? { ...x, __dirtyFront: e.target.value }
                                    : x
                                )
                              )
                            }
                            className="w-full text-xs p-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 h-24 focus:ring-2 focus:ring-indigo-500"
                          />
                        )}
                      </td>
                      <td className="p-3 align-top">
                        {!c.__editing && (
                          <div className="whitespace-pre-wrap break-words text-gray-700 dark:text-gray-200 leading-snug text-[13px] max-w-xs">
                            {c.entity.backText}
                          </div>
                        )}
                        {c.__editing && (
                          <textarea
                            value={c.__dirtyBack}
                            onChange={(e) =>
                              setCards((prev) =>
                                prev.map((x) =>
                                  x.id === c.id
                                    ? { ...x, __dirtyBack: e.target.value }
                                    : x
                                )
                              )
                            }
                            className="w-full text-xs p-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 h-24 focus:ring-2 focus:ring-indigo-500"
                          />
                        )}
                      </td>
                      <td className="p-3 align-top">
                        {!c.__editing && (
                          <div className="truncate max-w-[170px] text-gray-500 dark:text-gray-400 text-[12px]">
                            {c.entity.tags.join(", ") || (
                              <span className="text-gray-300 dark:text-gray-600">
                                —
                              </span>
                            )}
                          </div>
                        )}
                        {c.__editing && (
                          <input
                            value={c.__dirtyTags}
                            onChange={(e) =>
                              setCards((prev) =>
                                prev.map((x) =>
                                  x.id === c.id
                                    ? { ...x, __dirtyTags: e.target.value }
                                    : x
                                )
                              )
                            }
                            className="w-full text-xs p-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                          />
                        )}
                      </td>
                      <td className="p-3 align-top">
                        <div className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                          {Math.round(
                            ((c.entity.correctReviews || 0) /
                              (c.entity.totalReviews || 1)) *
                              100
                          )}
                          %
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {c.entity.totalReviews} tent.
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <button
                          onClick={() => toggleFavorite(c.id)}
                          className={`text-base transition ${
                            c.entity.favorite
                              ? "text-amber-500 drop-shadow-sm"
                              : "text-gray-400 hover:text-amber-500"
                          }`}
                        >
                          {c.entity.favorite ? "★" : "☆"}
                        </button>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {!c.__editing && (
                            <button
                              onClick={() => toggleEdit(c.id)}
                              className="px-2.5 py-1.5 text-[11px] rounded-md bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm"
                            >
                              Éditer
                            </button>
                          )}
                          {c.__editing && (
                            <button
                              onClick={() => saveEdit(c.id)}
                              className="px-2.5 py-1.5 text-[11px] rounded-md bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
                            >
                              Sauver
                            </button>
                          )}
                          {c.__editing && (
                            <button
                              onClick={() => toggleEdit(c.id)}
                              className="px-2.5 py-1.5 text-[11px] rounded-md bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              Annuler
                            </button>
                          )}
                          <button
                            onClick={() => move(c.id, -1)}
                            className="px-2 py-1 text-[11px] rounded-md bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => move(c.id, 1)}
                            className="px-2 py-1 text-[11px] rounded-md bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => deleteCard(c.id)}
                            className="px-2.5 py-1.5 text-[11px] rounded-md bg-red-600 text-white hover:bg-red-500 shadow-sm"
                          >
                            Suppr.
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filtered.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-12 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        <div className="max-w-sm mx-auto flex flex-col items-center gap-3">
                          <div className="text-5xl flex justify-center">
                            <Icons.Folder size="xl" />
                          </div>
                          <p>
                            Aucune carte trouvée. Commence par en créer une
                            juste au-dessus.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
