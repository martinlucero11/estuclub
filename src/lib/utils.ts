
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

/**
 * Generates initials from a name string.
 * @param name The full name.
 * @returns A string with the initials (e.g., "Café Martínez" -> "CM").
 */
export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

/**
 * Wraps external image URLs with a global CDN (wsrv.nl) to force WebP output and aggressive resizing.
 * This acts as a bulletproof fallback when Next.js native optimization silently fails in cloud hosting.
 */
export function optimizeImage(url: string | null | undefined, targetWidth: number = 800): string {
  if (!url) return '';
  
  // Skip if it's already optimized, local, or data URL
  if (url.includes('images.weserv.nl') || url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }

  // ONLY proxy domains that we know work well and are high-res
  const safeDomains = ['unsplash.com', 'firebasestorage.googleapis.com', 'googleusercontent.com'];
  const isSafe = safeDomains.some(domain => url.includes(domain));

  if (!isSafe) {
    return url;
  }

  // Use weserv.nl as an efficient CDN optimizer
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${targetWidth}&output=webp&q=80`;
}

/**
 * Generates DiceBear Micah URL from config string
 */
export function getAvatarUrl(avatarSeed: string | null | undefined): string | null {
  if (!avatarSeed || !avatarSeed.includes(':')) return null;
  
  const MICAH_BASE_URL = 'https://api.dicebear.com/9.x/micah/svg';
  const parts = avatarSeed.split('|');
  const config: any = { 
      skin: 'ffd1b1', 
      hair: 'dannyPhantom', // ✅ Corregido para Micah 9.x
      hcolor: '000000', 
      bcolor: '000000',
      beard: 'none', 
      mouth: 'smile',
      bg: 'transparent'
  };
  
  parts.forEach(part => {
    const [key, value] = part.split(':');
    if (key && value) config[key] = value;
  });
  
  return `${MICAH_BASE_URL}?baseColor=${config.skin}&hair=${config.hair}&hairColor=${config.hcolor}&facialHair=${config.beard === 'none' ? '' : config.beard}&facialHairProbability=${config.beard === 'none' ? 0 : 100}&facialHairColor=${config.bcolor}&mouth=${config.mouth}&backgroundColor=${config.bg === 'transparent' ? '' : config.bg}&hatProbability=0`;
}
