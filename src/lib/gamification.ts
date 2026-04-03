/**
 * Gamification utility for EstuClub.
 * Handles level calculations and badge definitions.
 */

export interface LevelInfo {
  level: number;
  minXp: number;
  maxXp: number;
  label: string;
  color: string;
}

const LEVEL_TIERS = [
  { threshold: 0, label: 'Novato', color: 'text-foreground bg-background' },
  { threshold: 50, label: 'Ahorrador', color: 'text-blue-600 bg-blue-100' },
  { threshold: 200, label: 'Fanático', color: 'text-estuclub-rosa bg-pink-100' },
  { threshold: 500, label: 'Leyenda', color: 'text-amber-600 bg-amber-100' },
  { threshold: 1000, label: 'Mítico', color: 'text-purple-600 bg-purple-100' },
];

/**
 * Calculates level info based on total points (XP).
 * Formula: Level = floor(sqrt(xp / 10)) + 1
 */
export function getLevelInfo(xp: number = 0): LevelInfo {
  const level = Math.floor(Math.sqrt(xp / 10)) + 1;
  const currentTier = [...LEVEL_TIERS].reverse().find(t => xp >= t.threshold) || LEVEL_TIERS[0];
  
  // XP ranges for the current level
  const minXpForCurrent = Math.pow(level - 1, 2) * 10;
  const minXpForNext = Math.pow(level, 2) * 10;

  return {
    level,
    minXp: minXpForCurrent,
    maxXp: minXpForNext,
    label: currentTier.label,
    color: currentTier.color,
  };
}

export function getProgressToNextLevel(xp: number = 0): number {
  const info = getLevelInfo(xp);
  const range = info.maxXp - info.minXp;
  if (range === 0) return 0;
  const progress = ((xp - info.minXp) / range) * 100;
  return Math.min(100, Math.max(0, progress));
}

