'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useTheme } from 'next-themes';

export function StatusBarConfig() {
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    const updateStatusBar = async () => {
      try {
        // We use resolvedTheme to handle 'system' preference correctly
        const currentTheme = resolvedTheme || theme;
        
        if (currentTheme === 'dark') {
          await StatusBar.setStyle({ style: Style.Dark });
          // Optional: Set a specific background color for Android
          // await StatusBar.setBackgroundColor({ color: '#000000' });
        } else {
          await StatusBar.setStyle({ style: Style.Light });
          // await StatusBar.setBackgroundColor({ color: '#ffffff' });
        }
      } catch (error) {
        // Failing silently is expected when running in a normal web browser
        // console.log('StatusBar not available in this environment');
      }
    };

    updateStatusBar();
  }, [theme, resolvedTheme]);

  return null; // This component doesn't render anything
}
