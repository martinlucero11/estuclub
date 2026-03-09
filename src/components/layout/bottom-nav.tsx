'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Ticket, QrCode, CalendarDays, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

export function BottomNav() {
  const pathname = usePathname();
  const { roles } = useUser();
  const showScanner = roles.includes('admin') || roles.includes('supplier');

  // Dynamically generate nav items based on scanner visibility
  const navItems = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/benefits', label: 'Beneficios', icon: Ticket },
    ...(showScanner ? [{ href: '/panel-cluber/scanner', label: 'Escanear', icon: QrCode, special: true }] : []),
    { href: '/turnos', label: 'Turnos', icon: CalendarDays },
    { href: '/announcements', label: 'Anuncios', icon: Megaphone },
  ];

  // Use a purge-safe method to set grid columns
  const gridClass = showScanner ? 'grid-cols-5' : 'grid-cols-4';

  return (
    <nav className={cn("fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-t border-border/50")}>
      <div className={cn("grid h-16", gridClass)}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center text-muted-foreground transition-all duration-200 active:scale-95',
              pathname === item.href && !item.special ? 'text-primary' : 'hover:text-primary'
            )}
          >
            {item.special ? (
                <div className="relative -top-4 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background">
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
