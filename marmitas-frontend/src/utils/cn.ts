import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge class names with Tailwind CSS
 * Uses clsx for conditional class merging and tailwind-merge to handle conflicting Tailwind classes
 * 
 * @param inputs - Class names or conditional class objects
 * @returns Merged class string with conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 