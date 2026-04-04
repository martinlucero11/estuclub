import React from 'react';
import Logo from '@/components/common/Logo';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 w-full min-h-screen flex items-center justify-center bg-white z-[9999]">
      <Logo 
        variant="rosa" 
        className="h-12 w-auto animate-pulse" 
      />
    </div>
  );
}

