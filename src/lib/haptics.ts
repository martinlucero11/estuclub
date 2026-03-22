/**
 * Haptic feedback utility for mobile devices
 */
export const haptic = {
  /**
   * Subtle vibration for a small interaction (liking, toggle)
   */
  vibrateSubtle: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  /**
   * Success vibration pattern
   */
  vibrateSuccess: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([10, 30, 10]);
    }
  },

  /**
   * Error vibration pattern
   */
  vibrateError: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
  },

  /**
   * Impact vibration for heavy interactions
   */
  vibrateImpact: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
  }
};
