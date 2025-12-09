import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utilitaire pour combiner des classes Tailwind CSS de manière intelligente
 * Fusionne les classes conflictuelles (ex: 'px-2 px-4' devient 'px-4')
 *
 * @example
 * cn('px-2 py-1', condition && 'px-4') // => 'px-4 py-1'
 * cn('text-red-500', props.className) // Permet override
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
