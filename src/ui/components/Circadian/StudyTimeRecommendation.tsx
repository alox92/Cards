/**
 * StudyTimeRecommendation - Card de recommandation de temps d'étude optimal
 * Affiche si c'est le bon moment pour étudier et suggère des actions
 */

import React from "react";
import Icons from "@/ui/components/common/Icons";
import type { StudyRecommendation } from "../../../application/services/circadianScheduler/ICircadianSchedulerService";

interface StudyTimeRecommendationProps {
  recommendation: StudyRecommendation;
  onStartStudy?: () => void;
}

export const StudyTimeRecommendation: React.FC<
  StudyTimeRecommendationProps
> = ({ recommendation, onStartStudy }) => {
  const getEnergyColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-green-100 border-green-500 text-green-800";
      case "medium":
        return "bg-yellow-100 border-yellow-500 text-yellow-800";
      case "low":
        return "bg-red-100 border-red-500 text-red-800";
      default:
        return "bg-gray-100 border-gray-500 text-gray-800";
    }
  };

  const getEnergyIcon = (level: string) => {
    switch (level) {
      case "high":
        return <Icons.Zap size="md" />;
      case "medium":
        return <Icons.Sparkles size="md" />;
      case "low":
        return <Icons.Clock size="md" />;
      default:
        return <Icons.Stats size="md" />;
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "hard":
        return <Icons.Target size="sm" />;
      case "medium":
        return <Icons.Decks size="sm" />;
      case "easy":
        return <Icons.File size="sm" />;
      default:
        return <Icons.Check size="sm" />;
    }
  };

  const cardColor = getEnergyColor(recommendation.energyLevel);

  return (
    <div className={`border-2 rounded-xl p-6 ${cardColor}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl flex items-center justify-center">
              {getEnergyIcon(recommendation.energyLevel)}
            </span>
            <h3 className="text-xl font-bold">
              {recommendation.shouldStudyNow
                ? "Bon moment pour étudier !"
                : "Pas le moment optimal"}
            </h3>
          </div>
          <p className="text-sm font-medium">{recommendation.message}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">Heure actuelle</p>
          <p className="text-2xl font-bold">{recommendation.currentHour}:00</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Durée optimale */}
        <div className="bg-white bg-opacity-50 rounded-lg p-3">
          <p className="text-xs font-semibold opacity-75 mb-1">
            Durée suggérée
          </p>
          <p className="text-xl font-bold">
            {recommendation.optimalDuration} min
          </p>
        </div>

        {/* Difficulté recommandée */}
        <div className="bg-white bg-opacity-50 rounded-lg p-3">
          <p className="text-xs font-semibold opacity-75 mb-1">
            Difficulté suggérée
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xl flex items-center justify-center">
              {getDifficultyIcon(recommendation.difficulty)}
            </span>
            <span className="text-xl font-bold capitalize">
              {recommendation.difficulty}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {recommendation.shouldStudyNow ? (
        <div className="space-y-2">
          <button
            onClick={onStartStudy}
            className="w-full bg-white hover:bg-opacity-90 text-green-800 font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Icons.Study size="sm" />
            <span>Commencer une session maintenant</span>
          </button>
          <p className="text-xs text-center opacity-75">
            C'est le moment idéal pour maximiser votre apprentissage
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="bg-white bg-opacity-50 rounded-lg p-3">
            <p className="text-sm font-semibold mb-1 flex items-center gap-2">
              <Icons.Clock size="sm" />
              <span>Meilleur créneau aujourd'hui</span>
            </p>
            <p className="text-2xl font-bold">
              {recommendation.recommendedHour}:00
            </p>
          </div>
          <p className="text-xs text-center opacity-75">
            Nous vous recommandons d'attendre ce créneau pour une performance
            optimale
          </p>
        </div>
      )}

      {/* Conseils additionnels */}
      <div className="mt-4 pt-4 border-t border-current border-opacity-20">
        <p className="text-xs font-semibold mb-2 flex items-center gap-1">
          <Icons.Info size="xs" />
          <span>Conseils :</span>
        </p>
        <ul className="text-xs space-y-1 opacity-90">
          {recommendation.energyLevel === "high" && (
            <>
              <li>• Profitez de ce moment pour les sujets difficiles</li>
              <li>• Votre concentration est à son maximum</li>
            </>
          )}
          {recommendation.energyLevel === "medium" && (
            <>
              <li>• Bon moment pour réviser du contenu familier</li>
              <li>• Alternez entre facile et moyen</li>
            </>
          )}
          {recommendation.energyLevel === "low" && (
            <>
              <li>• Privilégiez des révisions légères</li>
              <li>• Considérez une pause ou une activité relaxante</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};
