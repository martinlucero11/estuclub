
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Ticket, QrCode, CalendarDays, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

// The new set of navigation items for the bottom bar
const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/benefits', label: 'Beneficios', icon: Ticket },
  { href: '/dashboard/scanner', label: 'Escanear', icon: QrCode, special: true },
  { href: '/turnos', label: 'Turnos', icon: CalendarDays },
  { href: '/announcements', label: 'Anuncios', icon: Megaphone },
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
              'flex flex-col items-center justify-center w-1/5 text-muted-foreground transition-all duration-200 active:scale-95',
              // Apply active state color, but not to the special button
              pathname === item.href && !item.special ? 'text-primary' : 'hover:text-primary'
            )}
          >
            {item.special ? (
                // Special styling for the central QR scanner button
                <div className="relative -top-4 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <item.icon className="h-8 w-8" />
                </div>
            ) : (
                <>
                    <item.icon className="h-6 w-6" />
                    <span className="text-xs mt-1">{item.label}</span>
                </>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;
