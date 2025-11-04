/**
 * Class Name Utility
 * 
 * Merges Tailwind CSS classes with proper precedence handling.
 * Used throughout components for conditional styling.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


