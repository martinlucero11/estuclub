'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function AdminAnalyticsPage() {
    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-purple-500" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.3em] border-white/5 opacity-40">Business Intelligence</Badge>
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tighter italic">Data <span className="text-purple-500 italic">Core</span></h1>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Análisis profundo de ventas, comportamiento y retención.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Ticket Promedio', icon: TrendingUp, color: 'text-emerald-500' },
                    { label: 'Retención 30D', icon: Users, color: 'text-blue-500' },
                    { label: 'Heatmap Alem', icon: ShoppingBag, color: 'text-primary' },
                ].map((item) => (
                    <Card key={item.label} className="bg-card/20 border-white/5 rounded-[2.5rem] p-8 opacity-40 hover:opacity-100 transition-all border-none ring-1 ring-white/5">
                        <CardContent className="p-0 space-y-4">
                            <item.icon className={cn("h-8 w-8", item.color)} />
                            <h3 className="text-xl font-black uppercase tracking-tighter italic">{item.label}</h3>
                            <p className="text-[8px] font-bold uppercase tracking-widest opacity-50">Sincronizando con BigQuery...</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
