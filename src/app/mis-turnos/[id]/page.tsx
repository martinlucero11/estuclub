'use client';

import MainLayout from '@/components/layout/main-layout';
import { useDoc, useFirestore, useDocOnce } from '@/firebase';
import { doc, Timestamp } from 'firebase/firestore';
import { useMemo } from 'react';
import type { Appointment, SupplierProfile } from '@/types/data';
import AppointmentReceiptCard from '@/components/appointments/appointment-receipt-card';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function ReceiptSkeleton() {
    return (
        <div className="max-w-md mx-auto space-y-4">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
}

function AppointmentDetails({ appointment }: { appointment: Appointment }) {
    const firestore = useFirestore();
    const supplierRef = useMemo(
        () => doc(firestore, 'roles_supplier', appointment.supplierId),
        [firestore, appointment.supplierId]
    );
    const { data: supplier, isLoading: isLoadingSupplier } = useDocOnce<SupplierProfile>(supplierRef);

    const handleShareToWhatsApp = () => {
        if (!supplier?.whatsapp) return;

        let startDate: Date;
        // The data from Firestore is a Timestamp object
        if (appointment.startTime instanceof Timestamp) {
            startDate = appointment.startTime.toDate();
        } 
        // If it's already a JS Date object
        else if (appointment.startTime instanceof Date) {
            startDate = appointment.startTime;
        } 
        // Fallback for serialized object form (less likely with direct Firestore hook)
        else if (typeof appointment.startTime === 'object' && 'seconds' in appointment.startTime && typeof (appointment.startTime as any).seconds === 'number') {
             startDate = new Date((appointment.startTime as any).seconds * 1000);
        }
        else {
            // Final fallback if the format is unexpected
            startDate = new Date(); 
        }

        const message = `Hola, tengo una consulta sobre mi turno para el servicio *${appointment.serviceName}* reservado para el ${startDate.toLocaleString('es-ES')}. Mi ID de turno es: ${appointment.id}`;
        const whatsappUrl = `https://wa.me/${supplier.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="max-w-sm mx-auto flex flex-col gap-4">
            <AppointmentReceiptCard appointment={appointment} supplier={supplier} />
            {!isLoadingSupplier && supplier?.whatsapp && (
                <Button onClick={handleShareToWhatsApp}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contactar por WhatsApp
                </Button>
            )}
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

    const { data: appointment, isLoading, error } = useDoc<Appointment>(appointmentRef);

    return (
        <MainLayout>
             <div className="flex-1 space-y-8 p-4 md:p-8">
                <PageHeader title="Comprobante de Turno" />
                 <p className="text-muted-foreground -mt-8 mb-8 text-center">
                    Presenta este comprobante en el local.
                </p>

                <div className="flex justify-center">
                    {isLoading && <ReceiptSkeleton />}
                    
                    {!isLoading && error && (
                        <Alert variant="destructive" className="max-w-md">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                No se pudo cargar el turno. Es posible que no tengas permiso para verlo o que el ID sea incorrecto.
                            </AlertDescription>
                        </Alert>
                    )}

                    {!isLoading && !error && appointment && (
                        <AppointmentDetails appointment={appointment} />
                    )}

                    {!isLoading && !appointment && !error && (
                         <Alert className="max-w-md">
                            <AlertTitle>Turno no encontrado</AlertTitle>
                            <AlertDescription>
                                No pudimos encontrar un turno con el ID proporcionado.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
