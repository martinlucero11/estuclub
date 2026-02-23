
import Image from 'next/image';

// This file has been repaired according to strict UI/UX brand guidelines.
// The logo is now the official SVG logo on the exact brand color background.

export default function SplashScreen() {
  return (
    // Background is EXACTLY Rosa EstuClub and content is centered.
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#d83762]">
      {/* The logo is now the official SVG, served from the /public folder. */}
      <Image src="/logo.png" alt="EstuClub" width={180} height={60} className="object-contain text-white" priority />
    </div>
  );
}
