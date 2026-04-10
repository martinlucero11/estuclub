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
  ShieldAlert
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { KPIWidgets } from '@/components/admin/kpi-widgets';

export default function AdminControlCentralPage() {
    return (
        <div className="space-y-12 animate-in fade-in duration-1000">
            {/* Top Branding & Welcome */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-zinc-900 text-white border-none uppercase font-black text-[9px] tracking-[0.3em] px-4 py-1.5 rounded-full shadow-lg shadow-zinc-200">
                            Estuclub Hub
                        </Badge>
                        <div className="h-1 w-8 bg-zinc-100 rounded-full" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none font-montserrat text-zinc-900">
                        Admin <span className="text-primary italic">Central</span>
                    </h1>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] ml-1">
                        Arquitectura de Gestión Global • <span className="text-zinc-900">v3.0.0</span>
                    </p>
                </div>
            </div>

            {/* Real-Time Pulse: KPIs */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Desempeño en Tiempo Real</h2>
                </div>
                <KPIWidgets />
            </div>

            {/* THE COMMAND GRID: Module Access */}
            <div className="space-y-8">
                <div className="flex items-center gap-6 px-2">
                    <Layers className="h-4 w-4 text-zinc-900" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-900">Módulos Estratégicos</h2>
                    <div className="h-[1px] flex-1 bg-zinc-100" />
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
                        title="Marketing" 
                        desc="Gestión de Announcements, Categorías y envío de Push Notifications."
                        icon={Megaphone}
                        href="/admin/cms"
                        items={["Announcement Home", "Categorías Globales", "Push Directo"]}
                        accent="orange"
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

                    <AdminModule 
                        title="Sistema" 
                        desc="Configuración técnica del servidor, mantenimiento de DB y logs de MP."
                        icon={Settings}
                        href="/admin/settings"
                        items={["MP Webhooks", "Cron Jobs", "Ajustes Globales"]}
                        accent="slate"
                    />
                </div>
            </div>

            {/* Emergency / Critical Alert Section Placeholder */}
            <div className="bg-zinc-50 border border-zinc-100 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                <div className="h-20 w-20 rounded-[2.5rem] bg-white border border-zinc-100 flex items-center justify-center shadow-inner shrink-0">
                    <ShieldAlert className="h-10 w-10 text-zinc-300" />
                </div>
                <div className="space-y-1 text-center md:text-left flex-1">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900 italic">Estado de Infraestructura</h3>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-relaxed">
                        Todos los servicios operando normalmente. Latencia de base de datos dentro de los parámetros esperados (45ms).
                    </p>
                </div>
                <Button variant="outline" className="rounded-2xl h-14 px-8 uppercase font-black text-[10px] tracking-widest border-zinc-200">Ver Logs</Button>
            </div>
        </div>
    );
}

function AdminModule({ title, desc, icon: Icon, href, items, accent }: any) {
    const accentColors = {
        primary: "text-primary border-primary/10 bg-primary/[0.02]",
        blue: "text-blue-500 border-blue-500/10 bg-blue-500/[0.02]",
        orange: "text-orange-500 border-orange-500/10 bg-orange-500/[0.02]",
        emerald: "text-emerald-500 border-emerald-500/10 bg-emerald-500/[0.02]",
        purple: "text-purple-500 border-purple-500/10 bg-purple-500/[0.02]",
        slate: "text-zinc-600 border-zinc-200 bg-zinc-50",
    };

    const colorClass = accentColors[accent as keyof typeof accentColors] || accentColors.primary;

    return (
        <Link href={href}>
            <Card className={cn(
                "rounded-[3rem] p-1 group transition-all duration-500 overflow-hidden border-zinc-100 bg-white hover:shadow-2xl hover:shadow-zinc-200/50 hover:-translate-y-1 relative",
            )}>
                <CardContent className="p-10 space-y-8 relative z-10">
                    <div className="flex justify-between items-start">
                        <div className={cn(
                            "h-16 w-16 rounded-[1.5rem] flex items-center justify-center border transition-all duration-500 shadow-sm group-hover:scale-110 group-hover:rotate-6",
                            colorClass
                        )}>
                            <Icon className="h-8 w-8" />
                        </div>
                        <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                            <ArrowRight className="h-5 w-5 text-zinc-400" />
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <h3 className="text-3xl font-black italic tracking-tighter uppercase font-montserrat text-zinc-900 leading-none">{title}</h3>
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">{desc}</p>
                    </div>

                    <div className="pt-6 border-t border-zinc-50 flex flex-wrap gap-2">
                        {items.map((item: string) => (
                            <span key={item} className="text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100 group-hover:text-zinc-900 transition-all duration-300">
                                {item}
                            </span>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}


