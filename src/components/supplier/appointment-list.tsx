
'use client';

import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { BookUser, Calendar, Clock, Fingerprint, Phone } from 'lucide-react';
import type { Appointment } from '@/types/data';
import { useMemo } from 'react';
import { createConverter } from '@/lib/firestore-converter';

function AppointmentListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}


export default function AppointmentList() {
    const { user } = useUser();
    const firestore = useFirestore();

    // Query for LEGACY appointments in subcollection
    const legacyAppointmentsQuery = useMemo(() => {
        if (!user) return null;
        return query(
            collection(firestore, `roles_supplier/${user.uid}/appointments`).withConverter(createConverter<Appointment>()),
            where('startTime', '>=', new Date()),
            orderBy('startTime', 'asc')
        );
    }, [user, firestore]);
    const { data: legacyAppointments, isLoading: isLoadingLegacy } = useCollection(legacyAppointmentsQuery);

    // Query for NEW appointments in root collection
    const newAppointmentsQuery = useMemo(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'appointments').withConverter(createConverter<Appointment>()),
            where('supplierId', '==', user.uid),
            where('startTime', '>=', new Date()),
            orderBy('startTime', 'asc')
        );
    }, [user, firestore]);
    const { data: newAppointments, isLoading: isLoadingNew, error } = useCollection(newAppointmentsQuery);

    // Combine and sort appointments from both sources
    const appointments = useMemo(() => {
        const combined = [...(legacyAppointments || []), ...(newAppointments || [])];
        // Sort by startTime to have a consistent order
        combined.sort((a, b) => (a.startTime as Timestamp).toMillis() - (b.startTime as Timestamp).toMillis());
        // Simple deduplication based on ID, though IDs should be unique across collections
        const uniqueAppointments = Array.from(new Map(combined.map(item => [item.id, item])).values());
        return uniqueAppointments;
    }, [legacyAppointments, newAppointments]);

    const isLoading = isLoadingLegacy || isLoadingNew;

    if (isLoading) {
        return <AppointmentListSkeleton />;
    }

     if (error) {
        // You might want to handle this better, e.g., showing an error message for the new query
        return <p className="text-destructive text-center">Error al cargar los turnos. Es posible que se requiera un índice de base de datos. </p>;
    }


    if (!appointments || appointments.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
                <BookUser className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">Sin turnos próximos</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    No tienes ninguna reserva pendiente.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {appointments.map(apt => {
                const startTime = (apt.startTime as Timestamp).toDate();
                const userInitial = apt.userName.charAt(0).toUpperCase();

                return (
                    <Card key={apt.id} className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                             <div className="col-span-1 flex items-center gap-3">
                                 <Avatar className='h-12 w-12'>
                                    <AvatarFallback>{userInitial}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{apt.userName}</p>
                                    <p className="text-sm text-muted-foreground">{apt.serviceName}</p>
                                </div>
                            </div>
                            <div className="col-span-1 space-y-2 text-sm">
                                <div className='flex items-center gap-2 text-muted-foreground'>
                                    <Calendar className='h-4 w-4'/>
                                    {startTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </div>
                                <div className='flex items-center gap-2 text-muted-foreground'>
                                    <Clock className='h-4 w-4'/>
                                    {startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hs
                                </div>
                            </div>
                             <div className="col-span-1 space-y-2 text-sm">
                                <div className='flex items-center gap-2 text-muted-foreground'>
                                    <Fingerprint className='h-4 w-4'/>
                                    DNI: {apt.userDni}
                                </div>
                                <div className='flex items-center gap-2 text-muted-foreground'>
                                    <Phone className='h-4 w-4'/>
                                    {apt.userPhone}
                                </div>
                            </div>
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}
