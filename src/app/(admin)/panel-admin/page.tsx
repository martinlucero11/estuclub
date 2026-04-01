'use client';
/**
 * ESTUCLUB OVERLORD - MASTER CONTROL CENTRAL
 * Design Edition: Premium 2026-04-01
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Users, 
  Truck, 
  Store, 
  LayoutDashboard, 
  Bell, 
  Tag, 
  BarChart3, 
  GraduationCap, 
  Settings, 
  Sparkles, 
  Search,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function AdminControlCentralPage() {
    const { isAdmin, isUserLoading } = useUser();
    const [stats] = useState({
        totalUsers: "12.4k",
        pendingRiders: "8",
        pendingStudents: "142",
        pendingCincoDos: "15"
    });

    if (isUserLoading) return null;

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
                <div className="space-y-6">
                    <ShieldAlert className="h-20 w-20 text-[#d93b64] mx-auto animate-pulse" />
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">ACCESS DENIED</h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Restricted to Estuclub High Council</p>
                    <Button asChild className="bg-[#d93b64] text-white font-black rounded-xl">
                        <Link href="/">Back to Surface</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pb-32 selection:bg-[#d93b64]/30 font-inter">
            {/* Header: Overlord Branding */}
            <header className="pt-16 pb-12 px-6 md:px-12 bg-gradient-to-b from-[#d93b64]/20 to-transparent">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-10">
                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-[#d93b64] flex items-center justify-center shadow-[0_0_30px_#d93b64]">
                                <ShieldAlert className="h-7 w-7 text-white" />
                            </div>
                            <Badge className="bg-white/10 text-white border-white/20 uppercase font-black text-[10px] tracking-[0.3em] px-4 py-1.5 rounded-full backdrop-blur-md">Estuclub HQ</Badge>
                        </div>
                        <h1 className="text-7xl md:text-[10rem] font-black text-white uppercase tracking-tighter italic leading-[0.8] font-montserrat drop-shadow-2xl">
                            CONTROL <br/><span className="text-[#d93b64]">CENTRAL</span>
                        </h1>
                        <p className="text-[11px] font-black text-white/50 uppercase tracking-[0.6em] ml-3 opacity-60">Arquitectura de Gestión Global • Overlord v2.1</p>
                    </div>

                    <div className="flex items-center gap-6 bg-white/5 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/10 shadow-2xl">
                        <div className="text-right space-y-1">
                            <p className="text-[11px] font-black text-[#d93b64] uppercase tracking-widest">Admin Session</p>
                            <p className="text-xl font-black text-white italic tracking-tight font-montserrat uppercase">Overlord <span className="opacity-40">Active</span></p>
                        </div>
                        <div className="h-16 w-16 rounded-[1.5rem] border-2 border-[#d93b64]/40 p-1 bg-black/40">
                            <div className="h-full w-full rounded-[1rem] bg-[#d93b64]/20 flex items-center justify-center">
                                <Zap className="h-7 w-7 text-[#d93b64] animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 md:px-12 space-y-20">
                
                {/* 1. Real-Time Pulse: KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { label: "Usuarios Totales", val: stats.totalUsers, icon: Users, color: "text-blue-400" },
                        { label: "Riders Pendientes", val: stats.pendingRiders, icon: Truck, color: "text-[#d93b64]" },
                        { label: "Verif. Estudiantes", val: stats.pendingStudents, icon: GraduationCap, color: "text-emerald-400" },
                        { label: "Cinco Dos Appls", val: stats.pendingCincoDos, icon: Sparkles, color: "text-amber-400" },
                    ].map((idx) => (
                        <Card key={idx.label} className="bg-white/5 border-white/10 rounded-[2.5rem] overflow-hidden group hover:border-[#d93b64]/40 transition-all hover:bg-white/[0.07] shadow-xl">
                            <CardContent className="p-10 space-y-4">
                                <idx.icon className={cn("h-8 w-8 opacity-30 group-hover:opacity-100 transition-all group-hover:scale-110", idx.color)} />
                                <div className="space-y-1">
                                    <h3 className="text-5xl font-black text-white italic tracking-tighter font-montserrat leading-none">{idx.val}</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{idx.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* 2. THE COMMAND GRID: Module Access */}
                <div className="space-y-8">
                    <div className="flex items-center gap-6 px-4">
                        <h2 className="text-[12px] font-black text-white/40 uppercase tracking-[0.8em] italic whitespace-nowrap">MÓDULOS DE GESTIÓN INTEGRAL</h2>
                        <div className="h-[2px] w-full bg-white/10 rounded-full" />
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                        
                        {/* MODULE: VERIFICACIONES */}
                        <AdminModule 
                            title="VERIFICAR" 
                            desc="Aprobación de Riders (Docs), Estudiantes (Certificados) y Cinco Dos (Plus)."
                            icon={CheckCircle2}
                            href="/verify"
                            items={["Riders Pendientes", "Certificados de Alumno", "Postulantes Plus"]}
                            accent="#d93b64"
                        />

                        {/* MODULE: DISEÑO & UX */}
                        <AdminModule 
                            title="DISEÑO" 
                            desc="Home Builder, Secciones, Categorías y Banners del Home."
                            icon={Layers}
                            href="/panel-cluber/admin-tools"
                            items={["Order of Sections", "Main Banners", "Global Categories"]}
                            accent="#00F0FF"
                        />

                        {/* MODULE: DIFUSIÓN */}
                        <AdminModule 
                            title="DIFUSIÓN" 
                            desc="Carga de Beneficios Masivos, Anuncios en el Home y Push Notifications."
                            icon={Tag}
                            href="/panel-admin/content"
                            items={["Beneficios Exclusivos", "Anuncios Home", "Notificaciones Push"]}
                            accent="#FFD700"
                        />

                        {/* MODULE: COMERCIOS */}
                        <AdminModule 
                            title="COMERCIOS" 
                            desc="Gestión integral de Clubers: Permisos, Visibilidad, Featured y Cinco Dos."
                            icon={Store}
                            href="/panel-admin/clubers"
                            items={["Gestión de Permisos", "Toggles de Visibilidad", "Cinco Dos Control"]}
                            accent="#FF007F"
                        />

                        {/* MODULE: ANALYTICS */}
                        <AdminModule 
                            title="DATA CORE" 
                            desc="Estadísticas de venta, Ticket promedio y Eventos de comportamiento."
                            icon={BarChart3}
                            href="/panel-admin/analytics"
                            items={["Live Traffic Monitor", "Ticket Promedio", "User Retention"]}
                            accent="#FF4D00"
                        />

                        {/* MODULE: SEGURIDAD */}
                        <AdminModule 
                            title="SISTEMA" 
                            desc="Mantenimiento crítico, Webhook MP logs y Reset de Ranking global."
                            icon={Settings}
                            href="/panel-cluber/admin-tools"
                            items={["Database Maintenance", "MP Webhooks", "Reset Points"]}
                            accent="#FFFFFF"
                        />

                    </div>
                </div>

            </main>
        </div>
    );
}

function AdminModule({ title, desc, icon: Icon, href, items, accent }: any) {
    return (
        <Link href={href}>
            <Card className="bg-white/5 border-white/10 rounded-[3.5rem] p-1 group hover:bg-[#d93b64]/10 transition-all duration-700 overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 p-10 text-white/5 group-hover:text-[#d93b64]/15 transition-colors duration-700">
                    <Icon size={140} strokeWidth={0.5} />
                </div>
                <CardContent className="p-12 space-y-10 relative z-10">
                    <div className="space-y-6">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center border border-white/10 group-hover:border-[#d93b64]/50 transition-colors duration-700">
                            <Icon className="h-8 w-8 text-white group-hover:text-[#d93b64] transition-all duration-700 group-hover:scale-110" />
                        </div>
                        <div className="space-y-3">
                             <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase font-montserrat leading-none">{title}</h3>
                             <p className="text-xs font-bold text-white/50 leading-relaxed max-w-[220px]">{desc}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {items.map((item: string) => (
                            <div key={item} className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-[#d93b64]/50 group-hover:text-white/80 transition-colors duration-700">
                                <div className="h-1 w-1 rounded-full bg-[#d93b64] shadow-[0_0_8px_#d93b64]" />
                                {item}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 text-white font-black text-[10px] uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-all duration-700 translate-x-[-10px] group-hover:translate-x-0 italic">
                        ENTRAR A COMANDO <ArrowRight className="h-4 w-4 text-[#d93b64]" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
