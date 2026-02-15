
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gift, Megaphone, QrCode, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/benefits', label: 'Beneficios', icon: Gift },
    { href: '/proveedores', label: 'Suppliers', icon: Store },
    { href: '/supplier/scan', label: 'QR', icon: QrCode, isSpecial: true },
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/announcements', label: 'Anuncios', icon: Megaphone },
  ];

  return (
    <nav className="fixed bottom-0 z-40 w-full border-t bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto grid h-16 grid-cols-5 items-center justify-items-center px-4">
        {navItems.map(({ href, label, icon: Icon, isSpecial }) => {
          if (isSpecial) {
            return (
              <Link
                key={href}
                href={href}
                className="relative -top-5 flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-transform hover:scale-105"
                aria-label={label}
              >
                <Icon className="h-7 w-7" />
                <span className="text-xs font-bold">{label}</span>
              </Link>
            );
          }

          const isActive = href === '/' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-muted-foreground transition-colors hover:text-primary',
                isActive && 'text-primary'
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
