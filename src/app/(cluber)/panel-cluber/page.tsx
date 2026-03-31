
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
        // The main link to the panel itself should not be shown inside the panel
        if (item.href === '/panel-cluber') return false;

        const roleMatch = hasRequiredRole([activeRole], item.role);
        if (!roleMatch) return false;
        
        // If the item depends on a supplier capability, check it
        if (item.supplierCapability && activeRole === 'supplier') {
            return supplierData ? !!supplierData[item.supplierCapability] : false;
        }

        return true;
    });

  const groups = [
    {
        title: "Operaciones Diarias",
        items: dashboardNavItems.filter(i => ['Escanear QR', 'Canjes', 'Pedidos'].includes(i.title))
    },
    {
        title: "Mi Tienda",
        items: dashboardNavItems.filter(i => ['Mi Perfil de Cluber', 'Beneficios', 'Turnos', 'Anuncios', 'Productos'].includes(i.title))
    },
    {
        title: "Métricas & Comunidad",
        items: dashboardNavItems.filter(i => ['Mis Analíticas', 'Suscriptores', 'Solicitudes de Clubers', 'Gestión de Clubers', 'Analíticas Globales'].includes(i.title))
    },
    {
        title: "Personalización App",
        items: dashboardNavItems.filter(i => ['Diseño de Inicio', 'Gestión de Banners', 'Gestión de Categorías', 'Mantenimiento Usuarios', 'Herramientas del Sistema'].includes(i.title))
    }
  ];

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black tracking-tight leading-none">Panel de Control</h1>
            <p className="text-muted-foreground text-sm font-medium opacity-70 italic">
                Rol Activo: <span className="font-bold text-primary uppercase tracking-widest ml-1">{activeRole}</span>
            </p>
        </div>

        <div className="grid gap-8">
            {groups.map(group => group.items.length > 0 && (
                <div key={group.title} className="space-y-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 whitespace-nowrap">
                            {group.title}
                        </h2>
                        <div className="h-[1px] w-full bg-border/30" />
                    </div>
                    
                    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                        {group.items.map((item: SidebarNavItemLink) => {
                            const Icon = item.icon;
                            return (
                                <Link href={item.href} key={item.title} className="group">
                                    <div className="h-full p-4 rounded-3xl bg-card border border-border/40 hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col items-center text-center gap-3 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        
                                        <div className="p-3 rounded-2xl bg-muted group-hover:bg-primary group-hover:text-white transition-all duration-300 group-hover:scale-110 shadow-sm group-hover:shadow-primary/20">
                                            {Icon && <Icon className="h-5 w-5" />}
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <h3 className="text-xs font-bold tracking-tight leading-tight group-hover:text-primary transition-colors">
                                                {item.title}
                                            </h3>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
