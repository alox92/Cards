import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";
import { forwardRef } from "react";

// Variants pour le composant Card
const cardVariants = cva(
  "rounded-xl border transition-all duration-200 hover:shadow-sm hover:border-gray-200/80 dark:hover:border-gray-600/80",
  {
    variants: {
      variant: {
        default:
          "bg-white/95 dark:bg-slate-900/90 border-gray-100/80 dark:border-gray-700/80 shadow-[0_18px_40px_rgba(15,23,42,0.05)]",
        glass:
          "bg-white/80 dark:bg-gray-900/80 border-white/40 dark:border-gray-700/60 backdrop-blur-2xl shadow-[0_18px_50px_rgba(15,23,42,0.12)]",
        elevated:
          "bg-white/95 dark:bg-slate-900 border-gray-100 dark:border-gray-700 shadow-[0_20px_60px_rgba(15,23,42,0.14)]",
        gradient:
          "bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-900 border-primary-200 dark:border-gray-700",
        outline: "bg-transparent border-2 border-gray-300 dark:border-gray-600",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1 hover:shadow-xl cursor-pointer",
        glow: "hover:shadow-lg hover:shadow-primary-500/20 hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer",
        scale: "hover:scale-[1.02] cursor-pointer",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      hover: "none",
    },
  }
);

// Props du Card principal
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Contenu de la carte */
  children?: React.ReactNode;
}

/**
 * Composant Card avec variants
 *
 * @example
 * <Card variant="glass" hover="lift">
 *   <CardHeader>
 *     <CardTitle>Titre</CardTitle>
 *     <CardDescription>Description</CardDescription>
 *   </CardHeader>
 *   <CardContent>Contenu</CardContent>
 *   <CardFooter>Actions</CardFooter>
 * </Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hover, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, hover }), className)}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

// ============================================
// SOUS-COMPOSANTS
// ============================================

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5", className)}
      {...props}
    />
  )
);

CardHeader.displayName = "CardHeader";

export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode;
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-white",
        className
      )}
      {...props}
    />
  )
);

CardTitle.displayName = "CardTitle";

export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600 dark:text-gray-400", className)}
    {...props}
  />
));

CardDescription.displayName = "CardDescription";

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("pt-0", className)} {...props} />
  )
);

CardContent.displayName = "CardContent";

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center pt-4 gap-2", className)}
      {...props}
    />
  )
);

CardFooter.displayName = "CardFooter";
