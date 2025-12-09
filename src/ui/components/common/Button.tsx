import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";
import { forwardRef } from "react";

// Définition des variants avec CVA
const buttonVariants = cva(
  // Base classes communes à tous les boutons
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] transform-gpu hover:-translate-y-[1px]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-500 shadow-sm hover:shadow-md",
        secondary:
          "bg-secondary-100 text-secondary-900 hover:bg-secondary-200 active:bg-secondary-300 focus-visible:ring-secondary-500 dark:bg-secondary-900 dark:text-secondary-100 dark:hover:bg-secondary-800",
        outline:
          "border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-500 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-950",
        ghost:
          "hover:bg-gray-100 active:bg-gray-200 text-gray-700 focus-visible:ring-gray-500 dark:hover:bg-gray-800 dark:active:bg-gray-700 dark:text-gray-300",
        danger:
          "bg-error-500 text-white hover:bg-error-600 active:bg-error-700 focus-visible:ring-error-500 shadow-sm hover:shadow-md",
        success:
          "bg-success-500 text-white hover:bg-success-600 active:bg-success-700 focus-visible:ring-success-500 shadow-sm hover:shadow-md",
        warning:
          "bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700 focus-visible:ring-warning-500 shadow-sm hover:shadow-md",
        link: "text-primary-600 underline-offset-4 hover:underline focus-visible:ring-primary-500 dark:text-primary-400",
      },
      size: {
        sm: "px-3 py-1.5 text-sm h-8",
        md: "px-4 py-2 text-base h-10",
        lg: "px-6 py-3 text-lg h-12",
        xl: "px-8 py-4 text-xl h-14",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-md",
        md: "rounded-lg",
        lg: "rounded-xl",
        full: "rounded-full",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      rounded: "md",
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Affiche un spinner et désactive le bouton */
  isLoading?: boolean;
  /** Icône à gauche du texte */
  leftIcon?: React.ReactNode;
  /** Icône à droite du texte */
  rightIcon?: React.ReactNode;
  /** Props HTML natives */
  children?: React.ReactNode;
}

/**
 * Composant Button avec variants
 *
 * @example
 * <Button variant="primary" size="lg">Valider</Button>
 * <Button variant="outline" leftIcon={<Icon />}>Avec icône</Button>
 * <Button variant="danger" isLoading>Chargement...</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      rounded,
      fullWidth,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant, size, rounded, fullWidth }),
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {!isLoading && leftIcon && (
          <span className="mr-2 flex items-center" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {children}

        {!isLoading && rightIcon && (
          <span className="ml-2 flex items-center" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

// Export des variants pour usage externe
export { buttonVariants };
