
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
  const allRoles = ['user', ...roles];

  if (!items?.length) {
    return null;
  }

  return (
    <nav className="hidden gap-6 md:flex">
      {items.map((item, index) => {
        // Exclude items that are better suited for the user menu or mobile sheet
        if (item.href === '/panel-cluber' || item.href === '/settings') {
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
                pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
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
