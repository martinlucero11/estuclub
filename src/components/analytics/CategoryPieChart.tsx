'use client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f'];

interface PieChartProps {
    data: { name: string, value: number }[];
}

export function CategoryPieChart({ data }: PieChartProps) {
    
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];
        // Sort data to ensure consistent color mapping
        return data.sort((a, b) => b.value - a.value);
    }, [data]);

    if (!chartData || chartData.length === 0) {
        return <div className="h-64 flex items-center justify-center text-muted-foreground">No hay datos para mostrar.</div>
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Canjes']} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}
