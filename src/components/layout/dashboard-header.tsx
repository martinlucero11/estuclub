'use client';

import React from 'react';
import { useRole } from '@/context/role-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { capitalize } from '@/lib/utils';
import type { UserRole } from '@/types/data';
import Logo from '@/components/common/Logo';
import Link from 'next/link';

export function DashboardHeader() {
  const { availableRoles, activeRole, setActiveRole } = useRole();

  // Only show dashboard-relevant roles (admin, supplier) in the switcher.
  const dashboardRoles = availableRoles.filter(
    (role): role is 'admin' | 'supplier' => role === 'admin' || role === 'supplier'
  );

  const handleRoleChange = (role: string) => {
    setActiveRole(role as UserRole);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-md">
      <div className="h-14 flex items-center justify-between px-8">
        <Link href="/panel-cluber" className="hover:scale-105 transition-transform">
            <Logo variant="rosa" className="h-6 w-auto" />
        </Link>

        {/* Role Selector: Show only if the user has more than one dashboard role (i.e., is both admin and supplier) */}
        {dashboardRoles.length > 1 ? (
          <Select onValueChange={handleRoleChange} value={activeRole}>
            <SelectTrigger className="w-[180px] h-8 rounded-full bg-black/5 border-black/10 text-[10px] font-black tracking-widest uppercase text-black hover:bg-black/10 transition-all">
                <SelectValue placeholder="Seleccionar Vista" />
            </SelectTrigger>
            <SelectContent className="bg-white border-black/5 rounded-2xl shadow-2xl">
              {dashboardRoles.map(role => (
                <SelectItem key={role} value={role} className="text-[10px] font-black uppercase tracking-widest focus:bg-primary focus:text-white rounded-xl py-2 cursor-pointer transition-all">
                  {capitalize(role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="font-black text-[9px] text-black/40 uppercase tracking-[0.3em] flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
            Vista: {capitalize(activeRole)}
          </div>
        )}
      </div>
    </header>
  );
}

