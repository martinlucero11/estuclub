'use client';
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import {
    Store,
    Truck,
    Users,
    BarChart3,
    Settings,
    Layers,
    ArrowRight,
    TrendingUp,
    Megaphone,
    Zap
} from 'lucide-react';
import { useUser } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { KPIWidgets } from '@/components/admin/kpi-widgets';

export default function AdminControlCentralPage() {
    return (
        <div className="space-y-12 animate-in fade-in duration-1000">
            {/* Top Branding & Welcome */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary border-primary/20 uppercase font-black text-[9px] tracking-[0.3em] px-3 py-1 rounded-full">
                            Estuclub HQ
                        </Badge>
                        <div className="h-1 w-8 bg-primary/20 rounded-full" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none font-montserrat">
                        PANEL <span className="text-primary italic">ADMIN</span>
                    </h1>
                    <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.4em] ml-1">
                        Arquitectura de Gestión Global • v2.2.0
                    </p>
                </div>
            </div>

            {/* Real-Time Pulse: KPIs */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground">Métricas de Impacto</h2>
                </div>
                <KPIWidgets />
            </div>

            {/* THE COMMAND GRID: Module Access */}
            <div className="space-y-8">
                <div className="flex items-center gap-6 px-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground">Módulos de Gestión</h2>
                    <div className="h-[1px] flex-1 bg-white/5" />
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AdminModule
                        title="Comercios"
                        desc="Control total de locales, feature toggles y métricas de venta por sede."
                        icon={Store}
                        href="/admin/clubers"
                        items={["Listado Maestro", "Feature Toggles", "Editor de Catálogo"]}
                        accent="primary"
                    />

                    <AdminModule
                        title="Logística"
                        desc="Onboarding de Riders, monitor de actividad y tracking de viajes activos."
                        icon={Truck}
                        href="/admin/riders"
                        items={["Aprobación de Riders", "Monitor de Flota", "Filtros de Radio"]}
                        accent="blue"
                    />

                    <AdminModule
                        title="Home Builder"
                        desc="Constructor visual de las pantallas de Inicio, Delivery y Turnos."
                        icon={Zap}
                        href="/admin/home-builder"
                        items={["Order Designer", "Bloques Dinámicos", "Presets de Grilla"]}
                        accent="orange"
                    />

                    <AdminModule
                        title="Gestión CMS"
                        desc="Central de contenidos: Beneficios, Anuncios, Servicios y Productos."
                        icon={Megaphone}
                        href="/admin/cms"
                        items={["Editor de Perks", "Anuncios Globales", "Catálogo Central"]}
                        accent="primary"
                    />

                    <AdminModule
                        title="Usuarios"
                        desc="Base de datos de personas, verificación de estudiantes y simulación de sesión."
                        icon={Users}
                        href="/admin/users"
                        items={["Filtro de Personas", "Verificación Alumno", "Simular Sesión"]}
                        accent="emerald"
                    />

                    <AdminModule
                        title="Analytics"
                        desc="Estadísticas avanzadas, ticket promedio y mapas de calor de pedidos."
                        icon={BarChart3}
                        href="/admin/analytics"
                        items={["Data Core", "Retention Map", "Eventos de App"]}
                        accent="purple"
                    />

                </div>
            </div>
        </div>
    );
}

function AdminModule({ title, desc, icon: Icon, href, items, accent, ...props }: any) {
    const accentColors = {
        primary: "text-primary border-primary/20 bg-primary/5 hover:border-primary/50",
        blue: "text-blue-500 border-blue-500/20 bg-blue-500/5 hover:border-blue-500/50",
        orange: "text-orange-500 border-orange-500/20 bg-orange-500/5 hover:border-orange-500/50",
        emerald: "text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/50",
        purple: "text-purple-500 border-purple-500/20 bg-purple-500/5 hover:border-purple-500/50",
        slate: "text-foreground border-foreground/20 bg-background/5 hover:border-foreground/50",
    };

    const colorClass = accentColors[accent as keyof typeof accentColors] || accentColors.primary;

    const Content = (
        <Card className={cn("rounded-[2.5rem] p-1 group transition-all duration-500 overflow-hidden border-white/5 bg-card/30 hover:bg-card/50 shadow-premium relative", colorClass)}>
            <CardContent className="p-8 space-y-6 relative z-10">
                <div className="flex justify-between items-start">
                    <div className="h-14 w-14 rounded-2xl bg-background/50 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                        <Icon className="h-7 w-7" />
                    </div>
                    <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0" />
                </div>

                <div className="space-y-2">
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase font-montserrat">{title}</h3>
                    <p className="text-[10px] font-bold text-foreground leading-relaxed line-clamp-2">{desc}</p>
                </div>

                <div className="pt-4 border-t border-white/5 flex flex-wrap gap-2">
                    {items.map((item: string) => (
                        <span key={item} className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-background/30 text-foreground group-hover:text-foreground transition-colors">
                            {item}
                        </span>
                    ))}
                </div>
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href}>{Content}</Link>;
    }

    return (
        <button onClick={props.onClick} className="w-full text-left">
            {Content}
        </button>
    );
}


