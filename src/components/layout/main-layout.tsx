import type { ReactNode } from 'react';
import Header from './header';
import Footer from './footer';
import BottomNav from './bottom-nav';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20"> {/* Adjusted padding for bottom nav */}
        <div className="container mx-auto px-4 py-2">
            {children}
        </div>
      </main>
      {/* Footer can be kept or removed based on design preference */}
      {/* <Footer /> */}
      <BottomNav />
    </div>
  );
}
