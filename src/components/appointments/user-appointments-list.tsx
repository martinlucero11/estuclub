'use client';

import { useUser, useFirestore, useCollection, useDocOnce } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { BrandSkeleton } from '@/components/ui/brand-skeleton';
import { Card } from '@/components/ui/card';
import { History, Tag, Calendar, Building, ArrowRight } from 'lucide-react';
import type { Appointment } from '@/types/data';
import { useMemo } from 'react';
import { Badge } from '../ui/badge';
import { EmptyState } from '../ui/empty-state';
import { createConverter } from '@/lib/firestore-converter';
import { Button } from '../ui/button';
import Link from 'next/link';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

function AppointmentsListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-2">
                            <BrandSkeleton className="h-5 w-3/4 rounded-lg" />
                            <BrandSkeleton className="h-4 w-1/2 rounded-lg" />
                        </div>
                        <BrandSkeleton className="h-10 w-24 rounded-xl" />
                    </div>
                </Card>
            ))}
        </div>
    );
}

function AppointmentCard({ appointment, index }: { appointment: Appointment, index: number }) {
    const firestore = useFirestore();
    const supplierRef = useMemo(() => doc(firestore, 'roles_supplier', appointment.supplierId), [firestore, appointment.supplierId]);
    const { data: supplier, isLoading } = useDocOnce(supplierRef);
    
    const startTime = (appointment.startTime as Timestamp).toDate();

    const handleAddToCalendar = () => {
        const endTime = new Date(startTime.getTime() + 30 * 60000); 
        const format = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
        
        const url = new URL('https://www.google.com/calendar/render');
        url.searchParams.append('action', 'TEMPLATE');
        url.searchParams.append('text', `Turno: ${appointment.serviceName}`);
        url.searchParams.append('dates', `${format(startTime)}/${format(endTime)}`);
        url.searchParams.append('details', `Reserva en EstuClub para ${appointment.serviceName}. Por favor asistir 5 mins antes.`);
        
        window.open(url.toString(), '_blank');
    };

    return (
        <Card 
            key={appointment.id} 
            className={cn(
                "p-5 rounded-[2rem] border-primary/5 glass glass-dark shadow-premium group transition-all duration-500 hover:scale-[1.01]",
                "animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="flex flex-col md:flex-row md:items-center gap-6 w-full">
                {/* Time Section */}
                <div className="flex items-center gap-4 md:w-48 shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/10 shadow-sm">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-black uppercase tracking-widest text-foreground">
                            {startTime.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-xs font-bold text-muted-foreground opacity-70">
                            {startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                {/* Service Details */}
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-primary" />
                        <h3 className="text-base font-black tracking-tight text-foreground truncate group-hover:text-primary transition-colors uppercase">
                            {appointment.serviceName}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <Building className="h-3.5 w-3.5 text-muted-foreground" />
                        {isLoading ? (
                            <BrandSkeleton className="h-3 w-24 rounded-md" />
                        ) : (
                            <span className="text-xs font-bold text-muted-foreground opacity-80 uppercase tracking-wider">
                                {supplier?.name || 'Comercio'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-3 md:w-auto mt-2 md:mt-0">
                    <Badge 
                        variant="secondary"
                        className={cn(
                            "px-3 py-1 rounded-xl font-black uppercase tracking-widest text-[9px] border",
                            appointment.status === 'confirmed' 
                                ? "bg-green-500/10 text-green-600 border-green-500/20" 
                                : "bg-destructive/10 text-destructive border-destructive/20"
                        )}
                    >
                        {appointment.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                    </Badge>
                    
                    <div className="flex items-center gap-2">
                        {appointment.status === 'confirmed' && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                onClick={handleAddToCalendar}
                                title="Agregar al calendario"
                            >
                                <Calendar className="h-5 w-5" />
                            </Button>
                        )}
                        <Button asChild variant="outline" size="sm" className="h-10 rounded-xl font-black uppercase tracking-widest text-[10px] px-4 shadow-sm border-primary/10 hover:bg-primary/5 group/btn">
                            <Link href={`/mis-turnos/${appointment.id}`}>
                                Ver 
                                <ArrowRight className="h-3.5 w-3.5 ml-2 group-hover/btn:translate-x-1 transition-transform"/>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}


export default function UserAppointmentsList() {
    const { user } = useUser();
    const firestore = useFirestore();

    const appointmentsQuery = useMemo(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'appointments').withConverter(createConverter<Appointment>()),
            where('userId', '==', user.uid)
        );
    }, [user?.uid, firestore]);

    const { data: appointments, isLoading, error } = useCollection(appointmentsQuery);

    const sortedAppointments = useMemo(() => {
        if (!appointments) return [];
        return [...appointments].sort((a, b) => {
            const dateA = (a.startTime as Timestamp).toMillis();
            const dateB = (b.startTime as Timestamp).toMillis();
            return dateB - dateA;
        });
    }, [appointments]);

    if (isLoading) {
        return <AppointmentsListSkeleton />;
    }
    
    if (error) {
       return <p className="text-destructive text-center">Error al cargar los turnos: {error.message}</p>;
    }


    if (!sortedAppointments || sortedAppointments.length === 0) {
        return (
            <EmptyState 
                icon={History}
                title="No tienes turnos"
                description="Aún no has reservado ningún turno."
            />
        );
    }
    
    return (
        <div className="w-full space-y-4">
            {sortedAppointments.map((appointment, index) => (
                <AppointmentCard key={appointment.id} appointment={appointment} index={index} />
            ))}
        </div>
    )
}
