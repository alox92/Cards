import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UltraRichTextEditor from "../components/Editor/UltraRichTextEditor";
import { container } from "@/application/Container";
import {
  CARD_SERVICE_TOKEN,
  CardService,
} from "@/application/services/CardService";
import { parseCloze } from "@/utils/clozeParser";
import {
  DECK_SERVICE_TOKEN,
  DeckService,
} from "@/application/services/DeckService";
import OcclusionEditor from "@/ui/components/Occlusion/OcclusionEditor";
import {
  compressImageToDataUrl,
  estimateDataUrlSize,
} from "@/utils/imageCompression";
import {
  MEDIA_REPOSITORY_TOKEN,
  DexieMediaRepository,
} from "@/infrastructure/persistence/dexie/DexieMediaRepository";
import { escapeHtml } from "@/utils/sanitize";
import { logger } from "@/utils/logger";
import Icons from "@/ui/components/common/Icons";

const CardEditorPage = () => {
  const navigate = useNavigate();
  const { deckId } = useParams<{ deckId: string }>();
  const cardService = container.resolve<CardService>(CARD_SERVICE_TOKEN);
  const deckService = container.resolve<DeckService>(DECK_SERVICE_TOKEN);

  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [frontImage, setFrontImage] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState("");
  const [backImage, setBackImage] = useState<string | undefined>(undefined);
  const mediaRepo = container.resolve<DexieMediaRepository>(
    MEDIA_REPOSITORY_TOKEN
  );
  const [cardType, setCardType] = useState<"basic" | "cloze" | "occlusion">(
    "basic"
  );
  const [occlusionRegions, setOcclusionRegions] = useState<
    Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      label?: string;
    }>
  >([]);
  const [occlusionRegionsBack, setOcclusionRegionsBack] = useState<
    Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      label?: string;
    }>
  >([]);
  const [occlusionSide, setOcclusionSide] = useState<"front" | "back">("front");
  const [clozePreview, setClozePreview] = useState<{
    masked: string;
    count: number;
  } | null>(null);
  const [difficulty, setDifficulty] = useState(1);
  const [deckName, setDeckName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (deckId) {
      deckService.getDeck(deckId).then((d) => d && setDeckName(d.name));
    }
  }, [deckId, deckService]);

  const renderPreview = (text: string) => {
    const esc = escapeHtml(text);
    return esc
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
  };

  const handleSave = async () => {
    if (!frontText.trim() || !backText.trim() || !deckId) {
      alert("Veuillez remplir le recto et le verso de la carte");
      return;
    }

    setIsLoading(true);
    try {
      let front = frontText.trim();
      let clozeMap: any[] = [];
      if (cardType === "cloze") {
        const parsed = parseCloze(front);
        front = parsed.masked;
        clozeMap = parsed.map;
      }
      // Convertir DataURLs en blobs et sauvegarder dans le media repository
      let mediaRefs: Array<{
        id: string;
        type: "image" | "audio" | "pdf";
        key: string;
      }> = [];
      const dataUrlToBlob = async (dataUrl: string) => {
        const res = await fetch(dataUrl);
        return await res.blob();
      };
      let frontImageRef: string | undefined;
      let backImageRef: string | undefined;
      if (frontImage) {
        try {
          const blob = await dataUrlToBlob(frontImage);
          const ref = await mediaRepo.save(blob, "image", blob.type);
          mediaRefs.push(ref);
          frontImageRef = ref.id;
        } catch (e) {
          logger.warn("CardEditor", "Erreur sauvegarde image recto", { e });
        }
      }
      if (backImage) {
        try {
          const blob = await dataUrlToBlob(backImage);
          const ref = await mediaRepo.save(blob, "image", blob.type);
          mediaRefs.push(ref);
          backImageRef = ref.id;
        } catch (e) {
          logger.warn("CardEditor", "Erreur sauvegarde image verso", { e });
        }
      }
      await cardService.create(deckId, {
        frontText: front,
        backText: backText.trim(),
        frontImage: frontImageRef, // stocke l'id de référence
        backImage: backImageRef,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        difficulty,
        cardType,
        clozeMap,
        occlusionRegions: cardType === "occlusion" ? occlusionRegions : [],
        occlusionRegionsBack:
          cardType === "occlusion" ? occlusionRegionsBack : [],
        mediaRefs,
      } as any);
      navigate(`/study-service/${deckId}`);
    } catch (error) {
      logger.error("CardEditor", "Erreur création carte", { error });
      alert("Erreur lors de la création de la carte");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const difficultyLabels = {
    1: { label: "Facile", icon: <Icons.Easy size="sm" /> },
    2: { label: "Moyen", icon: <Icons.Medium size="sm" /> },
    3: { label: "Difficile", icon: <Icons.Hard size="sm" /> },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Icons.File size="lg" />
                Nouvelle Carte
              </h1>
              {deckName && (
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Icons.Decks size="sm" />
                  Pour le paquet :{" "}
                  <span className="font-medium">{deckName}</span>
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="btn-secondary flex items-center gap-2"
                disabled={isLoading}
              >
                <Icons.Cancel size="sm" />
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="btn-primary flex items-center gap-2"
                disabled={isLoading || !frontText.trim() || !backText.trim()}
              >
                <Icons.Save size="sm" />
                {isLoading ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>

        {/* Éditeur Unifié Recto/Verso */}
        <div className="mb-8">
          <UltraRichTextEditor
            value={frontText}
            onChange={setFrontText}
            backValue={backText}
            onBackChange={setBackText}
            placeholder="Tapez la question ou le terme à apprendre..."
            backPlaceholder="Tapez la réponse ou la définition..."
            height="500px"
          />
        </div>

        {/* Médias (Images) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Image Recto */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Icons.Image size="md" />
              Média Recto
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image
              </label>
              <input
                type="file"
                accept="image/*"
                className="text-sm w-full"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const compressed = await compressImageToDataUrl(file);
                    const size = estimateDataUrlSize(compressed);
                    if (size > 1_500_000) {
                      if (
                        !confirm(
                          `Image compressée mais toujours volumineuse (${(
                            size / 1024
                          ).toFixed(0)} Ko). Continuer ?`
                        )
                      )
                        return;
                    }
                    setFrontImage(compressed);
                  } catch (err) {
                    logger.error(
                      "CardEditorPage",
                      "Compression image échouée",
                      { err }
                    );
                  }
                }}
              />
              {frontImage && (
                <div className="mt-2 relative group">
                  <img
                    src={frontImage}
                    alt="preview"
                    className="max-h-40 rounded border object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setFrontImage(undefined)}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                  >
                    <Icons.Delete size="xs" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Image Verso */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Icons.Image size="md" />
              Média Verso
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image
              </label>
              <input
                type="file"
                accept="image/*"
                className="text-sm w-full"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const compressed = await compressImageToDataUrl(file);
                    setBackImage(compressed);
                  } catch (err) {
                    logger.error(
                      "CardEditorPage",
                      "Compression image verso échouée",
                      { err }
                    );
                  }
                }}
              />
              {backImage && (
                <div className="mt-2 relative group">
                  <img
                    src={backImage}
                    alt="preview back"
                    className="max-h-40 rounded border object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setBackImage(undefined)}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                  >
                    <Icons.Delete size="xs" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Options avancées */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icons.Settings size="md" />
            Options Avancées
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Icons.Folder size="sm" />
                Type de carte
              </label>
              <select
                value={cardType}
                onChange={(e) => {
                  const v = e.target.value as any;
                  setCardType(v);
                  if (v !== "cloze") setClozePreview(null);
                }}
                className="input"
              >
                <option value="basic">Basique</option>
                <option value="cloze">Cloze Deletion</option>
                <option value="occlusion">Image Occlusion</option>
              </select>
              {cardType === "cloze" && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Syntaxe: {"{{c1::texte}}"} crée un masquage. Incrémentez c1,
                  c2...
                </p>
              )}
              {cardType === "occlusion" && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">
                      Éditeur visuel – Shift+Cliquer pour créer une zone. Côté:
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setOcclusionSide((s) =>
                          s === "front" ? "back" : "front"
                        )
                      }
                      className="text-[11px] px-2 py-0.5 rounded border bg-white dark:bg-gray-700"
                    >
                      {occlusionSide === "front" ? "Recto" : "Verso"} ↔
                    </button>
                  </div>
                  <OcclusionEditor
                    regions={
                      occlusionSide === "front"
                        ? occlusionRegions
                        : occlusionRegionsBack
                    }
                    onChange={
                      occlusionSide === "front"
                        ? setOcclusionRegions
                        : setOcclusionRegionsBack
                    }
                    height={220}
                  />
                  {(occlusionSide === "front"
                    ? occlusionRegions
                    : occlusionRegionsBack
                  ).length > 0 && (
                    <div className="flex flex-wrap gap-1 text-[10px] mt-1">
                      {(occlusionSide === "front"
                        ? occlusionRegions
                        : occlusionRegionsBack
                      ).map((z) => (
                        <span
                          key={z.id}
                          className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                        >
                          {z.label || z.id.split("_").pop()}
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          occlusionSide === "front"
                            ? setOcclusionRegions([])
                            : setOcclusionRegionsBack([])
                        }
                        className="ml-auto text-red-500 hover:underline"
                      >
                        Reset {occlusionSide === "front" ? "Recto" : "Verso"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Tags */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Icons.Tag size="sm" />
                Tags (séparés par des virgules)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="vocabulaire, grammaire, niveau1..."
                className="input"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Les tags aident à organiser et filtrer vos cartes
              </p>
            </div>

            {/* Difficulté */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Icons.Target size="sm" />
                Niveau de difficulté
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="input"
              >
                {Object.entries(difficultyLabels).map(([value, data]) => (
                  <option key={value} value={value}>
                    {data.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Influence la fréquence de révision automatique
              </p>
            </div>
          </div>
          {cardType === "cloze" && (
            <div className="mt-4 p-3 rounded bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-200 flex items-start gap-2">
              <Icons.Info size="sm" />
              <div>
                <strong>Aperçu Cloze:</strong>{" "}
                {(() => {
                  const p = parseCloze(frontText);
                  if (!clozePreview || clozePreview.masked !== p.masked)
                    setClozePreview({ masked: p.masked, count: p.count });
                  return p.masked;
                })()}
                <div className="mt-1">Blocs: {clozePreview?.count || 0}</div>
              </div>
            </div>
          )}
        </div>

        {/* Aperçu en temps réel */}
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icons.Eye size="md" />
            Aperçu de la carte
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-[120px]">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <Icons.File size="sm" />
                Recto :
              </div>
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: renderPreview(frontText) }}
              />
              {frontImage && (
                <img
                  src={frontImage}
                  alt="Front"
                  className="mt-2 max-h-24 rounded"
                />
              )}
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-[120px]">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <Icons.File size="sm" />
                Verso :
              </div>
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: renderPreview(backText) }}
              />
              {backImage && (
                <img
                  src={backImage}
                  alt="Back"
                  className="mt-2 max-h-24 rounded"
                />
              )}
            </div>
          </div>

          {tags && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <Icons.Tag size="sm" />
                Tags :
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.split(",").map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full"
                  >
                    <Icons.Tag size="xs" />
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Aide */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <Icons.Info size="md" />
            Conseils pour créer de bonnes cartes :
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li className="flex items-start gap-2">
              <Icons.Check size="sm" className="mt-0.5 flex-shrink-0" />
              <span>Gardez les questions claires et concises</span>
            </li>
            <li className="flex items-start gap-2">
              <Icons.Check size="sm" className="mt-0.5 flex-shrink-0" />
              <span>
                Utilisez le formatage pour mettre en évidence les points
                importants
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Icons.Check size="sm" className="mt-0.5 flex-shrink-0" />
              <span>Ajoutez des tags pour organiser vos cartes par thème</span>
            </li>
            <li className="flex items-start gap-2">
              <Icons.Check size="sm" className="mt-0.5 flex-shrink-0" />
              <span>
                Évitez de mettre trop d'informations sur une seule carte
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CardEditorPage;
