
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Ticket, Trophy, User, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/proveedores', label: 'Clubers', icon: Store },
  { href: '/leaderboard', label: 'Ranking', icon: Trophy },
  { href: '/profile', label: 'Perfil', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center w-1/4 text-muted-foreground transition-all duration-200 active:scale-95',
              pathname === item.href ? 'text-primary' : 'hover:text-primary'
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;
