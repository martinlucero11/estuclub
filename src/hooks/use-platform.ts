'use client';

import { useState, useEffect } from 'react';

export type Platform = 'android' | 'ios' | 'web';

export function usePlatform() {
  const [platform, setPlatform] = useState<Platform>('web');

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    
    // Check for Capacitor or common mobile indicators
    const isAndroid = /android/.test(ua);
    const isIOS = /iphone|ipad|ipod/.test(ua);
    
    // Also check if running inside Capacitor
    const isCapacitor = (window as any).Capacitor !== undefined;
    
    if (isCapacitor) {
      if (isAndroid) setPlatform('android');
      else if (isIOS) setPlatform('ios');
    } else {
      setPlatform('web');
    }
  }, []);

  return {
    platform,
    isMobile: platform !== 'web',
    isAndroid: platform === 'android',
    isIOS: platform === 'ios',
    isWeb: platform === 'web'
  };
}
