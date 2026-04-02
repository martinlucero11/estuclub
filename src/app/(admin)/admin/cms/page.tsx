'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Layout, Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminCMSPage() {
    return (
        <div className="space-y-10">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Megaphone className="h-5 w-5 text-orange-500" />
                        </div>
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.3em] border-white/5 opacity-40">Marketing</Badge>
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter italic">Content <span className="text-orange-500 italic">Management</span></h1>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Gestión de banners, categorías y notificaciones push.</p>
                </div>
                <Button className="rounded-2xl h-14 bg-orange-500 text-white font-black uppercase text-[10px] tracking-widest px-8">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Contenido
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-card/30 border-white/5 rounded-[2.5rem] p-8 border-none ring-1 ring-white/5 opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                    <CardContent className="p-0 space-y-6">
                        <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                            <ImageIcon className="h-7 w-7 text-orange-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Banners Hero</h3>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest leading-relaxed">Próximamente: Editor visual de carruseles de la página de inicio.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/30 border-white/5 rounded-[2.5rem] p-8 border-none ring-1 ring-white/5 opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                    <CardContent className="p-0 space-y-6">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Layout className="h-7 w-7 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Categorías</h3>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest leading-relaxed">Próximamente: Gestión de etiquetas globis y mapeo de iconos.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
