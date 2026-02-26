
'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import type { Appointment } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Timestamp } from 'firebase/firestore';

interface AppointmentReceiptCardProps {
  appointment: Appointment;
}

export default function AppointmentReceiptCard({ appointment }: AppointmentReceiptCardProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!appointment.id) return;

    const qrCodeValue = JSON.stringify({ appointmentId: appointment.id });

    QRCode.toDataURL(qrCodeValue, {
        errorCorrectionLevel: 'H',
        width: 512,
        margin: 2,
    })
    .then(url => {
        setQrCodeUrl(url);
    })
    .catch(err => {
        console.error("QR Code Generation Error:", err);
    });
  }, [appointment.id]);

  const startTime = (appointment.startTime as Timestamp).toDate();

  return (
    <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <CardTitle>{appointment.serviceName}</CardTitle>
            <CardDescription>
                Turno confirmado para el {startTime.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
            <div className="p-2 border rounded-lg">
                {qrCodeUrl ? (
                    <Image src={qrCodeUrl} alt={`Código QR para turno`} width={250} height={250} />
                ) : (
                    <Skeleton className="h-[250px] w-[250px] rounded-lg" />
                )}
            </div>
            <div className="text-center">
                <p className="text-sm text-muted-foreground">Hora: <span className="font-bold text-foreground">{startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hs</span></p>
                <p className="text-xs text-muted-foreground font-mono mt-2">ID: {appointment.id}</p>
            </div>
        </CardContent>
        <CardFooter>
            <Button variant="secondary" className="w-full" onClick={() => window.print()}>
                Imprimir o Guardar PDF
            </Button>
        </CardFooter>
    </Card>
  );
}
