
'use client';

import MainLayout from '@/components/layout/main-layout';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo } from 'react';
import type { Appointment } from '@/types/data';
import AppointmentReceiptCard from '@/components/appointments/appointment-receipt-card';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';

function ReceiptSkeleton() {
    return (
        <div className="max-w-md mx-auto space-y-4">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
}

export default function AppointmentReceiptPage({ params }: { params: { id: string } }) {
    const { id: appointmentId } = params;
    const firestore = useFirestore();

    const appointmentRef = useMemo(
        () => appointmentId ? doc(firestore, 'appointments', appointmentId) : null,
        [appointmentId, firestore]
    );

    const { data: appointment, isLoading } = useDoc<Appointment>(appointmentRef);

    return (
        <MainLayout>
             <div className="flex-1 space-y-8 p-4 md:p-8">
                <PageHeader title="Comprobante de Turno" />
                 <p className="text-muted-foreground -mt-8 mb-8 text-center">
                    Presenta este comprobante en el local.
                </p>

                <div className="flex justify-center">
                    {isLoading && <ReceiptSkeleton />}
                    {!isLoading && appointment && <AppointmentReceiptCard appointment={appointment} />}
                    {!isLoading && !appointment && <p>No se encontró el turno.</p>}
                </div>
            </div>
        </MainLayout>
    );
}

