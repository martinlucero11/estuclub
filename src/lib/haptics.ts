import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Haptic feedback utility for mobile devices
 * Uses native Capacitor Haptics for premium mobile experience with web fallback
 */
export const haptic = {
  /**
   * Subtle vibration for a small interaction (liking, toggle)
   */
  vibrateSubtle: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  },
  
  /**
   * Medium vibration
   */
  vibrateMedium: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    }
  },

  /**
   * Success vibration pattern
   */
  vibrateSuccess: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([10, 30, 10]);
      }
    }
  },

  /**
   * Error vibration pattern
   */
  vibrateError: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([50, 100, 50]);
      }
    }
  },

  /**
   * Impact vibration for heavy interactions
   */
  vibrateImpact: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(25);
      }
    }
  }
};
