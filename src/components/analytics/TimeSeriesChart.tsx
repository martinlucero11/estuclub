'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { format, startOfDay } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface TimeSeriesChartProps {
    data: { [key: string]: any, createdAt?: Timestamp, redeemedAt?: Timestamp }[];
    dataKey: 'createdAt' | 'redeemedAt';
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-black/10 dark:border-white/10 p-4 rounded-2xl shadow-2xl ring-1 ring-black/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground dark:text-white/40 mb-1">
                    {format(new Date(label), "d 'de' MMMM, yyyy")}
                </p>
                <p className="text-xl font-black text-primary flex items-baseline gap-1">
                    {payload[0].value} <span className="text-[10px] uppercase text-foreground dark:text-white/60 tracking-widest">Canjes</span>
                </p>
            </div>
        );
    }
    return null;
};

export function TimeSeriesChart({ data, dataKey }: TimeSeriesChartProps) {
    const chartData = useMemo(() => {
        if (!data) return [];
        const countsByDay = data.reduce((acc, item) => {
            const date = item[dataKey]?.toDate();
            if (date) {
                const day = format(startOfDay(date), 'yyyy-MM-dd');
                acc[day] = (acc[day] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(countsByDay)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    }, [data, dataKey]);

    if (!chartData || chartData.length === 0) {
        return <div className="h-80 flex items-center justify-center text-foreground font-black uppercase tracking-tighter text-xs">Aún no hay datos suficientes</div>
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.1} vertical={false} />
                <XAxis 
                    dataKey="date" 
                    tickFormatter={(str) => format(new Date(str), "d MMM")}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    fontWeight="900"
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                />
                <YAxis 
                    allowDecimals={false}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    fontWeight="900"
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '5 5' }} 
                />
                <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    animationDuration={2000}
                    activeDot={{ r: 6, fill: 'white', stroke: 'hsl(var(--primary))', strokeWidth: 3 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

