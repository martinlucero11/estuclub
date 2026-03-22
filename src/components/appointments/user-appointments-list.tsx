'use client';

import { useUser, useFirestore, useCollection, useDocOnce } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
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
import { CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

function AppointmentsListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-10 w-24" />
                    </div>
                </Card>
            ))}
        </div>
    );
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
    const firestore = useFirestore();
    const supplierRef = useMemo(() => doc(firestore, 'roles_supplier', appointment.supplierId), [firestore, appointment.supplierId]);
    const { data: supplier, isLoading } = useDocOnce(supplierRef);
    
    const startTime = (appointment.startTime as Timestamp).toDate();

    const handleAddToCalendar = () => {
        const endTime = new Date(startTime.getTime() + 30 * 60000); // Default 30 min if not specified
        const format = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
        
        const url = new URL('https://www.google.com/calendar/render');
        url.searchParams.append('action', 'TEMPLATE');
        url.searchParams.append('text', `Turno: ${appointment.serviceName}`);
        url.searchParams.append('dates', `${format(startTime)}/${format(endTime)}`);
        url.searchParams.append('details', `Reserva en EstuClub para ${appointment.serviceName}. Por favor asistir 5 mins antes.`);
        
        window.open(url.toString(), '_blank');
    };

    return (
        <Card key={appointment.id} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center w-full">
                <div className="md:col-span-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-left">
                        <Tag className="h-4 w-4 text-primary" />
                        <p className="text-foreground truncate">{appointment.serviceName}</p>
                    </div>
                </div>
                 <div className="md:col-span-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building className="h-4 w-4" />
                        {isLoading ? <Skeleton className="h-4 w-24" /> : <span>{supplier?.name || 'Comercio'}</span>}
                    </div>
                </div>
                <div className="md:col-span-1 flex flex-col items-start md:items-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{startTime.toLocaleDateString('es-ES')} - {startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
                <div className="md:col-span-1 flex items-center justify-start md:justify-end gap-4">
                    <Badge variant={appointment.status === 'cancelled' ? 'destructive' : 'secondary'}>
                        {appointment.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                    </Badge>
                    {appointment.status === 'confirmed' && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-muted-foreground hover:text-primary transition-colors"
                            onClick={handleAddToCalendar}
                        >
                            Agendar
                        </Button>
                    )}
                     <Button asChild size="sm" variant="outline">
                        <Link href={`/mis-turnos/${appointment.id}`}>
                            Ver Comprobante
                            <ArrowRight className="h-4 w-4 ml-2"/>
                        </Link>
                    </Button>
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
            {sortedAppointments.map(appointment => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
        </div>
    )
}
