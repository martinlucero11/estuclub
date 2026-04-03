'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function KPIWidgets() {
  const firestore = useFirestore();

  // 1. Orders Today Query
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ordersTodayQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(today))
    );
  }, [firestore]);

  const { data: ordersToday, isLoading: loadingOrders } = useCollection(ordersTodayQuery);

  // 2. Active Orders Query
  const activeOrdersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'orders'),
      where('status', 'in', ['accepted', 'searching_rider', 'assigned', 'shipped'])
    );
  }, [firestore]);

  const { data: activeOrders, isLoading: loadingActive } = useCollection(activeOrdersQuery);

  // 3. New Users 24h Query
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const newUsersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'),
      where('createdAt', '>=', Timestamp.fromDate(last24h))
    );
  }, [firestore]);

  const { data: newUsers, isLoading: loadingUsers } = useCollection(newUsersQuery);

  // Calculations
  const stats = useMemo(() => {
    if (!ordersToday) return { revenue: 0, serviceFee: 0 };
    return ordersToday.reduce((acc, order: any) => {
      if (order.status !== 'cancelled') {
        acc.revenue += order.totalAmount || 0;
        // Service fee is 5% of subtotal (food only)
        // Note: For simplicity if subtotal isn't there we take totalAmount - shipping if possible
        // But usually order.serviceFee is stored or we recalculate:
        const fee = Math.round((order.totalSubtotal || (order.totalAmount - (order.deliveryCost || 0))) * 0.05);
        acc.serviceFee += fee;
      }
      return acc;
    }, { revenue: 0, serviceFee: 0 });
  }, [ordersToday]);

  const widgets = [
    {
      label: 'Ventas del Día',
      value: `$${stats.revenue.toLocaleString()}`,
      subtext: 'Alem, Hoy',
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10',
      loading: loadingOrders
    },
    {
      label: 'Service Fee (BETA)',
      value: `$${stats.serviceFee.toLocaleString()}`,
      subtext: 'Ganancia Estuclub',
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      loading: loadingOrders
    },
    {
      label: 'Pedidos Activos',
      value: activeOrders?.length || 0,
      subtext: 'En tiempo real',
      icon: ShoppingBag,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      loading: loadingActive
    },
    {
      label: 'Nuevos Usuarios',
      value: `+${newUsers?.length || 0}`,
      subtext: 'Últimas 24hs',
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      loading: loadingUsers
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {widgets.map((w, i) => (
        <Card key={w.label} className="rounded-[2.5rem] border-white/5 bg-background shadow-premium group overflow-hidden border-none glass-dark ring-1 ring-white/5">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div className={cn("p-4 rounded-2xl shadow-lg", w.bg)}>
                <w.icon className={cn("h-6 w-6", w.color)} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                <ArrowUpRight className="h-3 w-3" /> 12%
              </div>
            </div>
            <div className="mt-6 space-y-1">
              {w.loading ? (
                <Skeleton className="h-8 w-24 rounded-lg" />
              ) : (
                <h3 className="text-3xl font-black tracking-tighter leading-none">{w.value}</h3>
              )}
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{w.label}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-[9px] font-bold text-foreground italic uppercase tracking-widest opacity-60">{w.subtext}</p>
              <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

