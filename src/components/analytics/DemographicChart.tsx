'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

interface DemographicChartProps {
    title: string;
    description?: string;
    data: { name: string; value: number }[];
    type?: 'pie' | 'bar';
    colors?: string[];
}

const DEFAULT_COLORS = [
    'hsl(var(--primary))',
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-black/10 dark:border-white/10 p-4 rounded-2xl shadow-2xl ring-1 ring-black/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-white/40 mb-1">
                    {payload[0].name}
                </p>
                <p className="text-xl font-black text-primary flex items-baseline gap-1">
                    {payload[0].value} <span className="text-[10px] uppercase text-muted-foreground dark:text-white/60 tracking-widest">Usuarios</span>
                </p>
            </div>
        );
    }
    return null;
};

export function DemographicChart({ title, description, data, type = 'pie', colors = DEFAULT_COLORS }: DemographicChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card className="border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] overflow-hidden h-full shadow-xl">
                <CardHeader>
                    <CardTitle className="text-lg text-foreground dark:text-white">{title}</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground text-xs font-black uppercase tracking-widest">
                    Sin datos suficientes
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] overflow-hidden h-full shadow-xl">
            <CardHeader>
                <CardTitle className="text-lg text-foreground dark:text-white font-black italic">{title}</CardTitle>
                {description && <CardDescription className="text-muted-foreground dark:text-white/40">{description}</CardDescription>}
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    {type === 'pie' ? (
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} fillOpacity={0.8} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                                verticalAlign="bottom" 
                                height={36} 
                                iconType="circle"
                                formatter={(value) => <span className="text-[10px] font-bold text-muted-foreground dark:text-white/70 uppercase">{value}</span>}
                            />
                        </PieChart>
                    ) : (
                        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={100} 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                                stroke="hsl(var(--muted-foreground))"
                                className="font-bold"
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(var(--primary-rgb),0.05)' }} />
                            <Bar 
                                dataKey="value" 
                                radius={[0, 4, 4, 0]} 
                                barSize={20}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} fillOpacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
