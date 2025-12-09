/**
 * CircadianIndicator - Mini indicateur à afficher dans StudyPage
 * Montre rapidement si c'est le bon moment pour étudier
 */

import React, { useEffect, useState } from "react";
import { useCircadianSchedulerService } from "../../hooks/useCircadianSchedulerService";
import type { StudyRecommendation } from "../../../application/services/circadianScheduler/ICircadianSchedulerService";
import Icons from "@/ui/components/common/Icons";

interface CircadianIndicatorProps {
  userId: string;
  compact?: boolean;
}

export const CircadianIndicator: React.FC<CircadianIndicatorProps> = ({
  userId,
  compact = false,
}) => {
  const { service, isReady } = useCircadianSchedulerService();
  const [recommendation, setRecommendation] =
    useState<StudyRecommendation | null>(null);

  useEffect(() => {
    if (!isReady) return;

    const loadRecommendation = async () => {
      try {
        const profile = await service.initializeProfile(userId);
        const rec = await service.getStudyRecommendation(profile);
        setRecommendation(rec);
      } catch (error) {
        // Erreur silencieuse
      }
    };

    void loadRecommendation();

    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(() => {
      void loadRecommendation();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId, isReady, service]);

  if (!recommendation) return null;

  const getStatusColor = () => {
    switch (recommendation.energyLevel) {
      case "high":
        return "bg-green-100 text-green-800 border-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getIcon = () => {
    switch (recommendation.energyLevel) {
      case "high":
        return <Icons.Zap size="sm" />;
      case "medium":
        return <Icons.Sparkles size="sm" />;
      case "low":
        return <Icons.Clock size="sm" />;
      default:
        return <Icons.Stats size="sm" />;
    }
  };

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor()}`}
        title={recommendation.message}
      >
        <span className="flex items-center justify-center">{getIcon()}</span>
        <span>
          {recommendation.shouldStudyNow
            ? "Moment optimal"
            : `Mieux à ${recommendation.recommendedHour}h`}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-4 border-2 ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl flex items-center justify-center">
            {getIcon()}
          </span>
          <div>
            <p className="font-semibold">
              {recommendation.shouldStudyNow
                ? "Bon moment pour étudier !"
                : "Pas le moment optimal"}
            </p>
            <p className="text-xs opacity-75">{recommendation.message}</p>
          </div>
        </div>
        {!recommendation.shouldStudyNow && (
          <div className="text-right">
            <p className="text-xs opacity-75">Meilleur créneau</p>
            <p className="text-xl font-bold">
              {recommendation.recommendedHour}:00
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
