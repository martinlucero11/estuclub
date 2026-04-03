'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HeatmapChartProps {
    title: string;
    description?: string;
    data: { hour: number; day: number; count: number }[];
}

const DAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function HeatmapChart({ title, description, data }: HeatmapChartProps) {
    const maxCount = useMemo(() => Math.max(...data.map(d => d.count), 1), [data]);

    const grid = useMemo(() => {
        const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
        data.forEach(d => {
            if (d.day >= 0 && d.day < 7 && d.hour >= 0 && d.hour < 24) {
                matrix[d.day][d.hour] = d.count;
            }
        });
        return matrix;
    }, [data]);

    return (
        <Card className="border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-xl">
            <CardHeader>
                <CardTitle className="text-xl font-black italic text-foreground dark:text-white">{title}</CardTitle>
                {description && <CardDescription className="text-foreground dark:text-white/40">{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto pb-4">
                    <div className="min-w-[500px] flex flex-col gap-1.5">
                        {/* Hours Header */}
                        <div className="flex gap-1.5 mb-1.5">
                            <div className="w-10" />
                            {HOURS.filter(h => h % 3 === 0).map(h => (
                                <div key={h} className="flex-1 text-[8px] font-black text-foreground dark:text-white/30 text-center uppercase tracking-tighter">
                                    {h}:00
                                </div>
                            ))}
                        </div>

                        {grid.map((row, dayIndex) => (
                            <div key={dayIndex} className="flex gap-1.5 items-center">
                                <div className="w-10 text-[10px] font-black text-foreground dark:text-white/40 uppercase tracking-tighter">
                                    {DAYS[dayIndex]}
                                </div>
                                {row.map((count, hourIndex) => {
                                    const intensity = count / maxCount;
                                    return (
                                        <motion.div
                                            key={hourIndex}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: (dayIndex * 24 + hourIndex) * 0.001 }}
                                            className={cn(
                                                "flex-1 aspect-square rounded-[3px] border border-black/5 dark:border-white/5 transition-all duration-300 hover:scale-125 hover:z-10 cursor-pointer shadow-sm hover:shadow-primary/30",
                                                count > 0 ? "bg-primary" : "bg-black/5 dark:bg-white/5"
                                            )}
                                            style={{
                                                opacity: count > 0 ? 0.3 + intensity * 0.7 : 1,
                                            }}
                                            title={`${DAYS[dayIndex]} ${hourIndex}:00 - ${count} canjes`}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end items-center gap-2 mt-4 text-[8px] font-black text-foreground dark:text-white/30 uppercase tracking-widest">
                    <span>Menos</span>
                    <div className="flex gap-1">
                        {[0.1, 0.3, 0.6, 1].map(o => (
                            <div key={o} className="w-3 h-3 rounded-[2px] bg-primary" style={{ opacity: o }} />
                        ))}
                    </div>
                    <span>Más Actividad</span>
                </div>
            </CardContent>
        </Card>
    );
}

