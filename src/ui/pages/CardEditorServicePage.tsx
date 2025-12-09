import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UltraRichTextEditor from "@/ui/components/Editor/UltraRichTextEditor";
import { container } from "@/application/Container";
import {
  CARD_SERVICE_TOKEN,
  CardService,
} from "@/application/services/CardService";
import {
  DECK_SERVICE_TOKEN,
  DeckService,
} from "@/application/services/DeckService";

export default function CardEditorServicePage() {
  const navigate = useNavigate();
  const { deckId } = useParams<{ deckId: string }>();
  const cardService = container.resolve<CardService>(CARD_SERVICE_TOKEN);
  const deckService = container.resolve<DeckService>(DECK_SERVICE_TOKEN);

  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [tags, setTags] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [deckName, setDeckName] = useState<string>("");

  // Fetch deck name once (lazy)
  if (deckId && !deckName) {
    deckService.getDeck(deckId).then((d) => {
      if (d) setDeckName(d.name);
    });
  }

  const save = async () => {
    if (!deckId || !frontText.trim() || !backText.trim()) return;
    setIsLoading(true);
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
      navigate(`/study-service/${deckId}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Nouvelle carte (services)
            </h1>
            {deckName && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Deck: {deckName}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="btn-secondary">
              Annuler
            </button>
            <button
              disabled={isLoading || !frontText.trim() || !backText.trim()}
              onClick={save}
              className="btn-primary"
            >
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <UltraRichTextEditor
            value={frontText}
            onChange={setFrontText}
            backValue={backText}
            onBackChange={setBackText}
            placeholder="Recto..."
            backPlaceholder="Verso..."
            height="400px"
          />
        </div>
        <div className="card space-y-6">
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
            <label className="block text-sm font-medium mb-1">Difficulté</label>
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
            L'intervalle initial sera ajusté automatiquement après vos premières
            réponses.
          </div>
        </div>
      </div>
    </div>
  );
}
