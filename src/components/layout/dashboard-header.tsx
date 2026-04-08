'use client';

import React from 'react';
import { useRole } from '@/context/role-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { capitalize } from '@/lib/utils';
import type { UserRole } from '@/types/data';
import Logo from '@/components/common/Logo';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
    <header className="sticky top-0 z-[100] w-full border-b border-black/[0.03] dark:border-white/[0.03] bg-white/80 dark:bg-black/80 backdrop-blur-[20px] supports-[backdrop-filter]:bg-white/70">
      <div className="h-16 md:h-20 flex items-center justify-center px-6 md:px-12 relative overflow-hidden">
        
        <Link href="/panel-cluber" className="hover:scale-105 active:scale-95 transition-all duration-500 relative z-10">
            <Logo variant="rosa" className="w-28 md:w-36 h-auto" />
        </Link>

        {/* Role Selector / Indicator: Positioned absolutely to the right */}
        <div className="absolute right-4 md:right-12 flex items-center gap-4 z-20">
            {dashboardRoles.length > 1 ? (
              <Select onValueChange={handleRoleChange} value={activeRole}>
                <SelectTrigger className="w-[110px] md:w-[160px] h-8 md:h-10 rounded-xl bg-white/40 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/10 text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase text-foreground hover:bg-white/60 transition-all shadow-sm">
                    <SelectValue placeholder="Vista" />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border-black/5 dark:border-white/10 rounded-[1.5rem] p-2 shadow-2xl">
                  {dashboardRoles.map(role => (
                    <SelectItem key={role} value={role} className="text-[9px] font-black uppercase tracking-[0.2em] focus:bg-primary focus:text-white rounded-xl py-3 cursor-pointer transition-all">
                      {role === 'supplier' ? 'Cluber' : capitalize(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5"
              >
                <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(203,70,90,0.5)]" />
                    <span className="text-[8px] md:text-[9px] font-black text-foreground/40 uppercase tracking-[0.2em] md:tracking-[0.3em] italic">
                        <span className="hidden xs:inline">Vista: </span><span className="text-foreground/80">{activeRole === 'supplier' ? 'Cluber' : capitalize(activeRole)}</span>
                    </span>
                </div>
              </motion.div>
            )}
        </div>
      </div>
    </header>
  );
}
