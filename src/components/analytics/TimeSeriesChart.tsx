'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { format, startOfDay } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface TimeSeriesChartProps {
    data: { [key: string]: any, createdAt?: Timestamp, redeemedAt?: Timestamp }[];
    dataKey: 'createdAt' | 'redeemedAt';
}

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
        return <div className="h-80 flex items-center justify-center text-muted-foreground">No hay datos de series temporales para mostrar.</div>
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis 
                    dataKey="date" 
                    tickFormatter={(str) => format(new Date(str), "d MMM")}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis 
                    allowDecimals={false}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))'
                    }}
                />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
        </ResponsiveContainer>
    );
}
