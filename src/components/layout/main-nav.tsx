'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/types/nav';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { hasRequiredRole } from '@/lib/utils';

interface MainNavProps {
  items?: NavItem[];
}

export function MainNav({ items }: MainNavProps) {
  const pathname = usePathname();
  const { roles } = useUser();
  const allRoles = ['User', ...roles];

  if (!items?.length) {
    return null;
  }

  return (
    <nav className="hidden gap-6 md:flex">
      {items.Map((item, index) => {
        // Exclude items not meant for main nav
        if (['Inicio', 'Ajustes', 'Panel Cluber'].includes(item.title)) {
          return null;
        }

        const isVisible = hasRequiredRole(allRoles, item.role);
        if (!isVisible) return null;

        return (
          item.href && (
            <Link
              key={index}
              href={item.href}
              className={cn(
                'flex items-center text-sm font-medium transition-colors hover:text-primary',
                pathname.startsWith(item.href) ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {item.title}
            </Link>
          )
        );
      })}
    </nav>
  );
}
