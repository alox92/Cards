/**
 * Index des composants communs améliorés
 * Exports centralisés pour faciliter les imports
 */

// Composants de base
export { Button, type ButtonProps } from "./Button";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardProps,
} from "./Card";
export { Skeleton, SkeletonText } from "./Skeleton";
export { ToastProvider, useToast, toast } from "./Toast";
