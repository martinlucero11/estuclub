'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Heart, Users2, Trophy } from 'lucide-react';

interface LoyaltyMetricsProps {
    totalUsers: number;
    repeatUsers: number;
    newUsers: number;
    engagementCohorts: { name: string; value: number; color: string }[];
}

export function LoyaltyMetrics({ totalUsers, repeatUsers, newUsers, engagementCohorts }: LoyaltyMetricsProps) {
    const mainData = [
        { name: 'Recurrentes', value: repeatUsers, color: 'hsl(var(--primary))' },
        { name: 'Nuevos', value: newUsers, color: 'rgba(var(--primary-rgb), 0.2)' },
    ];

    const loyaltyRate = totalUsers > 0 ? ((repeatUsers / totalUsers) * 100).toFixed(1) : '0.0';

    return (
        <Card className="border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-xl border-2">
            <CardHeader className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 py-8">
                <CardTitle className="flex items-center gap-4 text-2xl font-black italic text-foreground dark:text-white">
                    <div className="p-3 bg-primary/20 rounded-2xl border border-primary/30">
                        <Heart className="h-6 w-6 text-primary fill-primary" />
                    </div>
                    Fidelización de Estudiantes
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
                <div className="grid gap-12 lg:grid-cols-2">
                    {/* Donut Chart */}
                    <div className="relative flex flex-col items-center justify-center">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={mainData}
                                        innerRadius={70}
                                        outerRadius={95}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {mainData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                                            backdropFilter: 'blur(12px)',
                                            border: '1px solid rgba(0,0,0,0.1)', 
                                            borderRadius: '16px',
                                            fontSize: '11px',
                                            fontWeight: '900',
                                            color: 'hsl(var(--foreground))',
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                                        }} 
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
                            <span className="text-4xl font-black text-primary tracking-tighter">{loyaltyRate}%</span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Tasa de Fidelidad</span>
                        </div>
                        <div className="flex gap-8 mt-4">
                            {mainData.map((d, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                    <span className="text-[10px] font-black uppercase text-foreground/60 dark:text-white/40">{d.name}: {d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Engagement Cohorts */}
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                                <Users2 className="h-4 w-4" />
                                Cohortes de Compromiso
                            </h4>
                            <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Segmentación por frecuencia de canje</p>
                        </div>
                        
                        <div className="space-y-4">
                            {engagementCohorts.map((cohort, i) => {
                                const percentage = totalUsers > 0 ? (cohort.value / totalUsers) * 100 : 0;
                                return (
                                    <div key={i} className="p-4 rounded-3xl bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-primary/20 transition-all group">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[11px] font-black text-foreground dark:text-white group-hover:text-primary transition-colors">{cohort.name}</span>
                                            <span className="text-[10px] font-black text-primary">{cohort.value} Est.</span>
                                        </div>
                                        <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full group-hover:scale-x-105 origin-left transition-transform duration-1000" 
                                                style={{ 
                                                    width: `${percentage}%`,
                                                    backgroundColor: cohort.color
                                                }} 
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-5 rounded-3xl border-2 border-dashed border-primary/20 bg-primary/5 flex items-center gap-4">
                            <div className="p-3 bg-primary rounded-2xl shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]">
                                <Trophy className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[11px] font-black text-foreground dark:text-white uppercase tracking-tighter italic">Estatus de Comunidad</p>
                                <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-tight">Tu negocio es "Top en Retención" este mes.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
