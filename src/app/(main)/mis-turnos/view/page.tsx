'use client';

import MainLayout from '@/components/layout/main-layout';
import { useDoc, useFirestore, useDocOnce, useUser } from '@/firebase';
import { doc, Timestamp } from 'firebase/firestore';
import { useMemo } from 'react';
import type { Appointment, SupplierProfile } from '@/types/data';
import AppointmentReceiptCard from '@/components/appointments/appointment-receipt-card';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ReviewForm } from '@/components/reviews/review-form';

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
        () => (appointment?.supplierId ? doc(firestore, 'roles_supplier', appointment.supplierId) : null),
        [firestore, appointment?.supplierId]
    );
    const { data: supplier, isLoading: isLoadingSupplier } = useDocOnce<SupplierProfile>(supplierRef);

    const handleShareToWhatsApp = () => {
        if (!supplier?.whatsapp || !appointment) return;

        let startDate: Date;
        if (appointment.startTime instanceof Timestamp) {
            startDate = appointment.startTime.toDate();
        } 
        else if (appointment.startTime instanceof Date) {
            startDate = appointment.startTime;
        } 
        else if (typeof appointment.startTime === 'object' && 'seconds' in appointment.startTime && typeof (appointment.startTime as any).seconds === 'number') {
             startDate = new Date((appointment.startTime as any).seconds * 1000);
        }
        else {
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

            {/* Review Section */}
            {appointment.status === 'attended' && !appointment.reviewed && (
                <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ReviewForm 
                        type="appointment"
                        appointmentId={appointment.id}
                        supplierId={appointment.supplierId}
                        title={appointment.serviceName}
                    />
                </div>
            )}
            
            {appointment.reviewed && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">¡Gracias por calificar este servicio!</p>
                </div>
            )}
        </div>
    )
}

export default function AppointmentReceiptPage() {
    const searchParams = useSearchParams();
    const appointmentId = searchParams.get('id');
    
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    const appointmentRef = useMemo(
        () => user && appointmentId ? doc(firestore, 'appointments', appointmentId) : null,
        [appointmentId, firestore, user]
    );

    const { data: appointment, isLoading, error } = useDoc<Appointment>(appointmentRef);
    const combinedIsLoading = isUserLoading || isLoading;

    return (
        <MainLayout>
             <div className="flex-1 space-y-8 p-4 md:p-8">
                <PageHeader title="Comprobante de Turno" />
                 <p className="text-foreground -mt-8 mb-8 text-center">
                    Presenta este comprobante en el local.
                </p>

                <div className="flex justify-center">
                    {combinedIsLoading && <ReceiptSkeleton />}

                    {!combinedIsLoading && !user && (
                         <Alert variant="destructive" className="max-w-md">
                            <ShieldAlert className="h-4 w-4" />
                            <AlertTitle>Acceso Denegado</AlertTitle>
                            <AlertDescription>
                                Debes iniciar sesión para ver los detalles de tu turno.
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    {!combinedIsLoading && user && (error || !appointmentId) && (
                        <Alert variant="destructive" className="max-w-md">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                {error?.message || 'ID de turno no proporcionado o inválido.'}
                            </AlertDescription>
                        </Alert>
                    )}

                    {!combinedIsLoading && user && !error && appointment && (
                        <AppointmentDetails appointment={appointment} />
                    )}

                    {!combinedIsLoading && user && !appointment && !error && appointmentId && (
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

