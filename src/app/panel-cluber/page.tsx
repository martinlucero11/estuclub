
'use client';

import React from 'react';
import Link from 'next/link';
import { useRole } from '@/context/role-context';
import { useUser } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { navConfig } from '@/config/nav-menu';
import { hasRequiredRole } from '@/lib/utils';
import type { SidebarNavItemLink } from '@/types/nav';


export default function PanelCluberPage() {
  const { activeRole } = useRole();
  const { supplierData } = useUser();

  // Filter dashboard items based on the active role and supplier capabilities
  const dashboardNavItems = navConfig.sidebarNav
    .flatMap(section => section.items || [])
    .filter(item => {
        const roleMatch = hasRequiredRole([activeRole], item.role);
        if (!roleMatch) return false;
        
        // If the item depends on a supplier capability, check it
        if (item.supplierCapability && activeRole === 'supplier') {
            return supplierData ? !!supplierData[item.supplierCapability] : false;
        }

        return true;
    });

  return (
    <div>
        <h1 className="text-3xl font-bold mb-2">Panel Cluber</h1>
        <p className="text-muted-foreground mb-8">
            Selecciona una acción para continuar. Rol activo: <span className="font-semibold text-primary">{activeRole}</span>.
        </p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dashboardNavItems.map((item: SidebarNavItemLink) => {
                const Icon = item.icon;
                return (
                    <Link href={item.href} key={item.title}>
                        <Card className="hover:shadow-lg transition-shadow rounded-2xl">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {item.title}
                                </CardTitle>
                                {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                            </CardHeader>
                            <div className="p-6 pt-0">
                                 <CardDescription>Accede a la sección de {item.title.toLowerCase()}.</CardDescription>
                            </div>
                        </Card>
                    </Link>
                )
            })}
        </div>
    </div>
  );
}
