
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gift, Megaphone, QrCode, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupplier } from '@/firebase/auth/use-supplier';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';

export default function BottomNav() {
  const pathname = usePathname();
  const { isSupplier } = useSupplier();
  const { user } = useUser();

  const navItems = [
    { href: '/benefits', label: 'Beneficios', icon: Gift },
    { href: '/proveedores', label: 'Suppliers', icon: Store },
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/announcements', label: 'Anuncios', icon: Megaphone },
  ];

  return (
    <>
      <nav className="fixed bottom-0 z-40 w-full border-t bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto grid grid-cols-4 h-16 items-center justify-around px-4">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 p-2 text-muted-foreground transition-colors hover:text-primary',
                (pathname === href || (href === '/proveedores' && pathname.startsWith('/proveedores'))) && 'text-primary'
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
