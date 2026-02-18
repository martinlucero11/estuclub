
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if the user has at least one of the required roles to view a navigation item.
 *
 * @param userRoles - An array of roles the user currently has.
 * @param requiredRole - The role or array of roles required to view the item.
 * @returns {boolean} - True if the user meets the role requirements, false otherwise.
 */
export function hasRequiredRole(userRoles: string[], requiredRole?: string | string[]): boolean {
  // If the item has no specific role requirement, it's visible to everyone.
  if (!requiredRole || requiredRole.length === 0) {
    return true;
  }

  // If the user has no roles, they can't access a protected item.
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  // If a single role is required, check if the user has it.
  if (typeof requiredRole === 'string') {
    return userRoles.includes(requiredRole);
  }

  // If an array of roles is required, check if the user has at least one of them.
  return requiredRole.some(role => userRoles.includes(role));
}

/**
 * Capitalizes the first letter of a string.
 * @param str The string to capitalize.
 * @returns The capitalized string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
