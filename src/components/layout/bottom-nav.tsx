
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Ticket, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/my-redemptions', label: 'Mis Canjes', icon: Ticket },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
  { href: '/profile', label: 'Perfil', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center text-gray-500 transition-all duration-200 active:scale-95',
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
