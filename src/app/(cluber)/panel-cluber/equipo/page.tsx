'use client';

export const dynamic = 'force-dynamic';


import React from 'react';
import { useUser } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Shield, Star, Clock, AlertCircle } from 'lucide-react';
import BackButton from '@/components/layout/back-button';
import Link from 'next/link';

export default function TeamManagementPage() {
    const { roles, userData } = useUser();

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-12 pb-32 animate-in fade-in duration-700">
            <BackButton />
            
            <header className="mb-12 mt-8 space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                    <Users className="h-4 w-4 text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Staff & Permisos</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none italic font-montserrat">
                    Gestión de <span className="text-indigo-500">Equipo</span>
                </h1>
                <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest max-w-lg">Administrá los accesos de tus colaboradores y asigná roles operativos.</p>
            </header>

            <div className="grid gap-8 md:grid-cols-3">
                {/* Placeholder Staff Card */}
                <Card className="rounded-[2.5rem] border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white overflow-hidden group">
                   <CardContent className="p-8 space-y-6">
                      <div className="flex items-center justify-between">
                         <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <Shield className="h-8 w-8 text-indigo-500" />
                         </div>
                         <Button variant="ghost" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-indigo-500">EDITAR</Button>
                      </div>
                      <div className="space-y-1">
                         <h3 className="text-xl font-black uppercase italic tracking-tighter">{userData?.displayName || 'Admin Principal'}</h3>
                         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Dueño / Overlord</p>
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex gap-4">
                         <div className="flex-1 text-center">
                            <p className="text-xs font-black text-indigo-500">100%</p>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase">Accesos</p>
                         </div>
                         <div className="flex-1 text-center border-l border-slate-100">
                            <p className="text-xs font-black text-indigo-500">-</p>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase">Actividad</p>
                         </div>
                      </div>
                   </CardContent>
                </Card>

                {/* Add Member Card */}
                <Card className="rounded-[2.5rem] border-2 border-dashed border-indigo-500/20 bg-transparent flex flex-col items-center justify-center p-12 text-center space-y-6 hover:bg-indigo-500/5 transition-all group">
                   <div className="h-16 w-16 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <UserPlus className="h-8 w-8" />
                   </div>
                   <div className="space-y-2">
                       <h3 className="text-lg font-black uppercase tracking-tighter">Sumar Miembro</h3>
                       <p className="text-xs font-medium text-muted-foreground max-w-[200px]">Invitá a un nuevo colaborador para gestionar ventas o escanear beneficios.</p>
                   </div>
                   <Button className="h-12 w-full rounded-2xl bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px]">INVITAR AHORA</Button>
                </Card>

                {/* Info Card */}
                <Card className="rounded-[2.5rem] border-none bg-slate-900 text-white p-10 flex flex-col justify-between overflow-hidden relative shadow-2xl">
                   <div className="absolute -right-10 -bottom-10 opacity-10">
                       <Clock className="h-40 w-40 text-white" />
                   </div>
                   <div className="space-y-6 relative z-10">
                      <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                         <AlertCircle className="h-6 w-6 text-indigo-300" />
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter leading-[0.9] italic">Control de Accesos <br/><span className="text-indigo-400">Próximamente</span></h3>
                      <p className="text-xs font-medium text-white/50 leading-relaxed uppercase tracking-widest">Estamos trabajando en un sistema granular para que puedas definir qué ve cada miembro de tu equipo.</p>
                   </div>
                   <Link href="/support" className="text-[10px] font-black uppercase tracking-widest text-indigo-300 hover:text-white transition-colors relative z-10">Más Información →</Link>
                </Card>
            </div>
        </div>
    );
}
