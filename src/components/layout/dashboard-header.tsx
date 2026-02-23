'use client';

import React from 'react';
import { useRole } from '@/context/role-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { capitalize } from '@/lib/utils'; // Helper to capitalize strings

export function DashboardHeader() {
  const { availableRoles, activeRole, setActiveRole } = useRole();

  // Only show dashboard-relevant roles (admin, supplier) in the switcher.
  const dashboardRoles = availableRoles.filter(role => role === 'admin' || role === 'supplier');

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="h-16 flex items-center justify-end px-8">
        {/* Role Selector: Show only if the user has more than one dashboard role (i.e., is both admin and supplier) */}
        {dashboardRoles.length > 1 ? (
          <Select onValueChange={(role) => setActiveRole(role as any)} defaultValue={activeRole}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar Vista" />
            </SelectTrigger>
            <SelectContent>
              {dashboardRoles.map(role => (
                <SelectItem key={role} value={role}>
                  {capitalize(role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="font-medium text-sm text-muted-foreground">
            Vista: {capitalize(activeRole)}
          </div>
        )}
      </div>
    </header>
  );
}
