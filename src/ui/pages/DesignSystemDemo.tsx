import { Button } from "@/ui/components/common/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/ui/components/common/Card";
import { Skeleton, SkeletonText } from "@/ui/components/common/Skeleton";
import { useToast, toast } from "@/ui/components/common/Toast";
import { typography } from "@/ui/design/typography";
import { cn } from "@/utils/cn";
import { useState } from "react";

/**
 * Page de démo des nouveaux composants UX/UI
 * Accessible via /design-system-demo
 */
export const DesignSystemDemo = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleToastSuccess = () => {
    showToast(
      toast.success("Opération réussie !", "La carte a été ajoutée au deck")
    );
  };

  const handleToastError = () => {
    showToast(
      toast.error(
        "Erreur rencontrée",
        "Impossible de sauvegarder les modifications"
      )
    );
  };

  const handleToastWarning = () => {
    showToast(
      toast.warning("Attention", "Vous avez atteint 90% de votre quota")
    );
  };

  const handleToastInfo = () => {
    showToast(
      toast.info("Information", "Nouvelle fonctionnalité disponible !")
    );
  };

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1
            className={cn(
              typography.display.lg,
              "bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent"
            )}
          >
            Design System Demo
          </h1>
          <p
            className={cn(
              typography.body.large,
              "text-gray-600 dark:text-gray-400"
            )}
          >
            Nouveaux composants UX/UI avec variants et accessibilité WCAG 2.1 AA
          </p>
        </div>

        {/* Buttons Section */}
        <section>
          <h2 className={cn(typography.heading.h2, "mb-6")}>
            Boutons avec Variants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Primary</CardTitle>
                <CardDescription>Bouton d'action principale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="primary" size="sm" fullWidth>
                  Small
                </Button>
                <Button variant="primary" size="md" fullWidth>
                  Medium
                </Button>
                <Button variant="primary" size="lg" fullWidth>
                  Large
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Secondary</CardTitle>
                <CardDescription>Actions secondaires</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="secondary" size="md" fullWidth>
                  Secondary
                </Button>
                <Button variant="outline" size="md" fullWidth>
                  Outline
                </Button>
                <Button variant="ghost" size="md" fullWidth>
                  Ghost
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">États</CardTitle>
                <CardDescription>Statuts et feedback</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="success" size="md" fullWidth>
                  Success
                </Button>
                <Button variant="warning" size="md" fullWidth>
                  Warning
                </Button>
                <Button variant="danger" size="md" fullWidth>
                  Danger
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Loading</CardTitle>
                <CardDescription>États de chargement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="primary" isLoading size="md" fullWidth>
                  Chargement...
                </Button>
                <Button variant="secondary" disabled size="md" fullWidth>
                  Désactivé
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Icons</CardTitle>
                <CardDescription>Avec icônes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  leftIcon={<span>📚</span>}
                >
                  Avec icône gauche
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  rightIcon={<span>→</span>}
                >
                  Avec icône droite
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rounded</CardTitle>
                <CardDescription>Variantes arrondies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="primary" rounded="sm" size="md" fullWidth>
                  Small Radius
                </Button>
                <Button variant="primary" rounded="full" size="md" fullWidth>
                  Full Rounded
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cards Section */}
        <section>
          <h2 className={cn(typography.heading.h2, "mb-6")}>
            Cards avec Variants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="default" hover="lift">
              <CardHeader>
                <CardTitle className="text-base">Default</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Carte par défaut avec effet lift au survol
                </p>
              </CardContent>
            </Card>

            <Card variant="glass" hover="glow">
              <CardHeader>
                <CardTitle className="text-base">Glass</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Glassmorphism avec glow au survol
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" hover="scale">
              <CardHeader>
                <CardTitle className="text-base">Elevated</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Carte avec ombre et effet scale
                </p>
              </CardContent>
            </Card>

            <Card variant="gradient" hover="lift">
              <CardHeader>
                <CardTitle className="text-base">Gradient</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Fond dégradé élégant
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Toast Notifications Section */}
        <section>
          <h2 className={cn(typography.heading.h2, "mb-6")}>
            Toast Notifications
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Système de notifications</CardTitle>
              <CardDescription>
                Cliquez pour tester les différents types de toasts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="success" onClick={handleToastSuccess}>
                  Success Toast
                </Button>
                <Button variant="danger" onClick={handleToastError}>
                  Error Toast
                </Button>
                <Button variant="warning" onClick={handleToastWarning}>
                  Warning Toast
                </Button>
                <Button variant="primary" onClick={handleToastInfo}>
                  Info Toast
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Skeletons Section */}
        <section>
          <h2 className={cn(typography.heading.h2, "mb-6")}>
            Loading States (Skeletons)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Skeleton Simple</CardTitle>
                <CardDescription>États de chargement élégants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-8 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skeleton Texte</CardTitle>
                <CardDescription>Pour paragraphes et contenus</CardDescription>
              </CardHeader>
              <CardContent>
                <SkeletonText lines={4} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loading Demo</CardTitle>
                <CardDescription>Cliquez pour voir l'animation</CardDescription>
              </CardHeader>
              <CardContent>
                {!isLoading ? (
                  <Button
                    variant="primary"
                    onClick={handleLoadingDemo}
                    fullWidth
                  >
                    Simuler chargement (3s)
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <SkeletonText lines={3} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Card avec Footer</CardTitle>
                <CardDescription>Exemple complet avec actions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Contenu de la carte avec boutons d'action en bas
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">
                  Annuler
                </Button>
                <Button variant="primary" size="sm">
                  Valider
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Typography Section */}
        <section>
          <h2 className={cn(typography.heading.h2, "mb-6")}>
            Échelle Typographique
          </h2>
          <Card>
            <CardContent className="space-y-6 py-6">
              <div>
                <p className={cn(typography.display.xl)}>Display XL - 60px</p>
                <p className={cn(typography.display.lg)}>Display LG - 48px</p>
                <p className={cn(typography.display.md)}>Display MD - 36px</p>
              </div>
              <div>
                <p className={cn(typography.heading.h1)}>Heading H1 - 30px</p>
                <p className={cn(typography.heading.h2)}>Heading H2 - 24px</p>
                <p className={cn(typography.heading.h3)}>Heading H3 - 20px</p>
                <p className={cn(typography.heading.h4)}>Heading H4 - 18px</p>
              </div>
              <div>
                <p className={cn(typography.body.large)}>Body Large - 18px</p>
                <p className={cn(typography.body.base)}>Body Base - 16px</p>
                <p className={cn(typography.body.small)}>Body Small - 14px</p>
                <p className={cn(typography.body.xs)}>Body XS - 12px</p>
              </div>
              <div>
                <p className={cn(typography.label.large)}>Label Large</p>
                <p className={cn(typography.label.base)}>Label Base</p>
                <p className={cn(typography.label.small)}>Label Small</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Accessibility Section */}
        <section>
          <h2 className={cn(typography.heading.h2, "mb-6")}>
            Accessibilité (WCAG 2.1 AA)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Focus States</CardTitle>
                <CardDescription>
                  Naviguer avec Tab pour voir les focus rings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button className="focus-ring px-4 py-2 bg-primary-600 text-white rounded-lg w-full">
                  Bouton avec .focus-ring
                </button>
                <input
                  type="text"
                  placeholder="Input avec focus natif"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Raccourcis clavier</CardTitle>
                <CardDescription>
                  Indications visuelles avec kbd
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <kbd className="kbd">Ctrl</kbd> + <kbd className="kbd">K</kbd>
                  <span className="text-gray-600 dark:text-gray-400">
                    Recherche
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <kbd className="kbd">Esc</kbd>
                  <span className="text-gray-600 dark:text-gray-400">
                    Fermer
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd>
                  <span className="text-gray-600 dark:text-gray-400">
                    Navigation
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contrastes validés</CardTitle>
                <CardDescription>
                  Ratios conformes WCAG AA (4.5:1)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted">Texte muted - gray-600 (7:1) ✓</p>
                <p className="text-subtle">Texte subtle - gray-500 (4.6:1) ✓</p>
                <p className="text-gray-900 dark:text-gray-50">
                  Texte principal (17:1) ✓
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Touch Targets</CardTitle>
                <CardDescription>
                  Zones tactiles minimales 44x44px
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <button className="touch-target bg-primary-600 text-white rounded-lg">
                  OK
                </button>
                <button className="touch-target bg-secondary-600 text-white rounded-lg">
                  ✓
                </button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};
