'use client';

import { useMemo, useState } from 'react';
import { type SerializableBenefitRedemption } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TimeRange = 'today' | 'week' | 'month' | 'all';

export default function RedemptionsStats({ redemptions }: { redemptions: SerializableBenefitRedemption[] }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const filteredRedemptions = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (timeRange) {
      case 'today':
        return redemptions.filter(r => new Date(r.redeemedAt) >= today);
      case 'week':
        return redemptions.filter(r => new Date(r.redeemedAt) >= weekStart);
      case 'month':
        return redemptions.filter(r => new Date(r.redeemedAt) >= monthStart);
      case 'all':
      default:
        return redemptions;
    }
  }, [redemptions, timeRange]);

  const totalRedemptions = filteredRedemptions.length;

  const redemptionsByBenefit = useMemo(() => {
    return filteredRedemptions.reduce((acc, redemption) => {
      acc[redemption.benefitTitle] = (acc[redemption.benefitTitle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredRedemptions]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Estadísticas de Canjes</CardTitle>
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total de Canjes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{totalRedemptions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Canjes por Beneficio</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(redemptionsByBenefit).length > 0 ? (
                <ul className="space-y-2">
                  {Object.entries(redemptionsByBenefit).map(([title, count]) => (
                    <li key={title} className="flex justify-between">
                      <span>{title}</span>
                      <span className="font-bold">{count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No hay canjes en este período.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
