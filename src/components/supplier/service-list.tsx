
'use client';

import type { Service, Availability } from '@/lib/data';
import { Button } from '../ui/button';
import { Calendar, Clock, Search, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/card';
import BookingDialog from '../booking/booking-dialog';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

interface ServiceListProps {
  services: Service[];
  availability: Availability;
  supplierId: string;
  allowsBooking: boolean;
}

export default function ServiceList({ services, availability, supplierId, allowsBooking }: ServiceListProps) {
  
  if (!allowsBooking) {
    return (
       <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Reservas no habilitadas</AlertTitle>
        <AlertDescription>
          Este proveedor actualmente no tiene habilitada la opción para reservar turnos.
        </AlertDescription>
      </Alert>
    )
  }

  if (!services || services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
        <Search className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">No hay servicios disponibles</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Este proveedor aún no ha añadido ningún servicio para reservar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {services.map(service => (
        <Card key={service.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-lg">{service.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{service.duration} min</span>
              </div>
            </div>
          </div>

          <BookingDialog service={service} availability={availability} supplierId={supplierId}>
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Reservar Turno
            </Button>
          </BookingDialog>
          
        </Card>
      ))}
    </div>
  );
}
