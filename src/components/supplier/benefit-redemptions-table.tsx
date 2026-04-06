'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Ticket, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { createConverter } from '@/lib/firestore-converter';
import type { BenefitRedemption } from '@/types/data';
import { cn } from '@/lib/utils';

export function BenefitRedemptionsTable({ supplierId }: { supplierId: string }) {
    const firestore = useFirestore();

    const redemptionsQuery = useMemo(() => {
        if (!firestore || !supplierId) return null;
        return query(
            collection(firestore, 'benefitRedemptions').withConverter(createConverter<BenefitRedemption>()),
            where('supplierId', '==', supplierId),
            orderBy('redeemedAt', 'desc'),
            limit(20)
        );
    }, [firestore, supplierId]);

    const { data: redemptions, isLoading } = useCollection(redemptionsQuery);

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (!redemptions || redemptions.length === 0) {
        return (
            <div className="py-12 text-center space-y-4 opacity-50">
                <Ticket className="h-12 w-12 mx-auto text-foreground" />
                <p className="font-bold uppercase tracking-widest text-[10px]">No hay canjes registrados aún</p>
            </div>
        );
    }

    return (
        <div className="rounded-[2rem] border border-white/5 bg-background/50 overflow-hidden">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="hover:bg-transparent border-white/10">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Usuario</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Beneficio</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Fecha</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-right">Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {redemptions.map((redemption) => (
                        <TableRow key={redemption.id} className="hover:bg-white/[0.02] border-white/5">
                            <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black tracking-tight">{redemption.userName}</span>
                                        <span className="text-[9px] text-foreground font-bold uppercase tracking-tighter">DNI: {redemption.userDni}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="py-4">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold leading-tight">{redemption.benefitTitle}</span>
                                    <span className="text-[9px] text-foreground font-medium truncate max-w-[150px]">Cod: {redemption.qrCodeValue}</span>
                                </div>
                            </TableCell>
                            <TableCell className="py-4">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {format(redemption.redeemedAt.toDate(), "d MMM, HH:mm", { locale: es })}
                                </div>
                            </TableCell>
                            <TableCell className="py-4 text-right">
                                <Badge className={cn(
                                    "text-[9px] font-black uppercase tracking-widest rounded-lg px-2 py-0.5",
                                    redemption.status === 'used' 
                                        ? "bg-green-500/10 text-green-500 border-green-500/20" 
                                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                )}>
                                    {redemption.status === 'used' ? 'CANJEADO' : 'PENDIENTE'}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

