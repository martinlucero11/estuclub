
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gift, Megaphone, QrCode } from 'lucide-react';
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
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/announcements', label: 'Anuncios', icon: Megaphone },
  ];

  return (
    <>
      {user && isSupplier && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2">
          <Link href="/scanner">
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90"
            >
              <QrCode className="h-7 w-7" />
              <span className="sr-only">Escanear QR</span>
            </Button>
          </Link>
        </div>
      )}
      <nav className="fixed bottom-0 z-40 w-full border-t bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-around px-4">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex w-20 flex-col items-center gap-1 p-2 text-muted-foreground transition-colors hover:text-primary',
                pathname === href && 'text-primary'
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
