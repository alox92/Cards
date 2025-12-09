import { useDeckSuggestions } from "@/ui/hooks/useDeckSuggestions";
import { DeckSuggestions, RetentionMetrics } from "@/ui/components/stats";
import Icons from "@/ui/components/common/Icons";
import { Card, CardContent } from "@/ui/components/common/Card";
import { typography } from "@/ui/design/typography";
import { cn } from "@/utils/cn";
import WorkspaceGlassLayout from "@/ui/components/layout/WorkspaceGlassLayout";

/**
 * 📊 Page de Statistiques Avancées avec Suggestions IA
 */
const StatsPage = () => {
  const {
    suggestions,
    isLoading,
    error,
    getTodaySuggestions,
    getGlobalStats,
    filterByStatus,
  } = useDeckSuggestions();

  if (isLoading) {
    return (
      <WorkspaceGlassLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Icons.Refresh
              size="xl"
              className="animate-spin mx-auto mb-4 text-blue-500"
            />
            <p className="text-gray-600 dark:text-gray-400">
              Chargement des statistiques...
            </p>
          </div>
        </div>
      </WorkspaceGlassLayout>
    );
  }

  if (error) {
    return (
      <WorkspaceGlassLayout maxWidthClassName="max-w-xl">
        <div className="flex items-center justify-center py-8">
          <Card className="w-full text-center">
            <CardContent className="pt-6">
              <Icons.Warning size="xl" className="mx-auto mb-4 text-red-500" />
              <h2 className={typography.heading.h3}>Erreur de Chargement</h2>
              <p
                className={cn(
                  typography.body.base,
                  "text-gray-500 dark:text-gray-400"
                )}
              >
                {error}
              </p>
            </CardContent>
          </Card>
        </div>
      </WorkspaceGlassLayout>
    );
  }

  const globalStats = getGlobalStats();
  const todaySuggestions = getTodaySuggestions();

  return (
    <WorkspaceGlassLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1
            className={cn(
              typography.heading.h1,
              "mb-2 flex items-center gap-3"
            )}
          >
            <Icons.Stats size="xl" />
            Tableau de Bord
          </h1>
          <p
            className={cn(
              typography.body.large,
              "text-gray-600 dark:text-gray-400"
            )}
          >
            Vue d'ensemble de votre progression et recommandations
            personnalisées
          </p>
        </div>

        {/* Métriques Globales */}
        <RetentionMetrics
          totalDecks={globalStats.totalDecks}
          totalCards={globalStats.totalCards}
          dueToday={globalStats.dueToday}
          unlearnedCards={globalStats.unlearnedCards}
          masteredCards={globalStats.masteredCards}
          retention={globalStats.retention}
        />

        {/* Suggestions du Jour */}
        {todaySuggestions.length > 0 && (
          <DeckSuggestions
            suggestions={todaySuggestions}
            title="Priorités du Jour"
          />
        )}

        {/* Toutes les Suggestions */}
        {suggestions.length > 0 && (
          <DeckSuggestions
            suggestions={suggestions}
            title="Tous les Paquets"
            showAll
          />
        )}

        {/* Filtres par Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(["unlearned", "urgent", "soon", "mastered"] as const).map(
            (status) => {
              const filtered = filterByStatus(status);
              if (filtered.length === 0) return null;

              const statusLabels = {
                unlearned: {
                  label: "Non Appris",
                  icon: <Icons.Add size="md" />,
                  color: "text-red-600",
                },
                urgent: {
                  label: "Urgent",
                  icon: <Icons.Warning size="md" />,
                  color: "text-orange-600",
                },
                soon: {
                  label: "Bientôt",
                  icon: <Icons.Clock size="md" />,
                  color: "text-yellow-600",
                },
                mastered: {
                  label: "Maîtrisés",
                  icon: <Icons.Check size="md" />,
                  color: "text-green-600",
                },
              };

              const statusInfo = statusLabels[status];

              return (
                <Card
                  key={status}
                  className="text-center hover:shadow-lg transition-shadow cursor-default"
                >
                  <CardContent className="pt-6">
                    <div
                      className={`${statusInfo.color} mb-2 flex justify-center`}
                    >
                      {statusInfo.icon}
                    </div>
                    <div
                      className={`text-3xl font-bold ${statusInfo.color} mb-1`}
                    >
                      {filtered.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {statusInfo.label}
                    </div>
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>
      </div>
    </WorkspaceGlassLayout>
  );
};

export default StatsPage;
