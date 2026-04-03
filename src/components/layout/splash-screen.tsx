import Image from 'next/image';

// This file has been repaired according to strict UI/UX brand guidelines.
// The logo is now the official SVG logo on the exact brand color background.

export default function SplashScreen() {
  return (
    // Background is EXACTLY Rosa EstuClub and content is centered.
    <div className="fixed inset-0 w-full min-h-screen flex items-center justify-center bg-background z-[9999]">
      {/* The logo is now the official SVG, served from the /public folder. */}
      <Image 
        src="/logo-rosa.svg" 
        alt="EstuClub" 
        width={180} 
        height={60} 
        className="object-contain animate-pulse" 
        priority 
      />
    </div>
  );
}

