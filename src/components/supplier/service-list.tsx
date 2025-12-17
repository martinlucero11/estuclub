
'use client';

import type { Service } from '@/lib/data';
import { Button } from '../ui/button';
import { Calendar, Clock, Info, Search } from 'lucide-react';
import { Card } from '../ui/card';

interface ServiceListProps {
  services: Service[];
}

export default function ServiceList({ services }: ServiceListProps) {
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
          <Button disabled>
            <Calendar className="mr-2 h-4 w-4" />
            Reservar Turno
          </Button>
        </Card>
      ))}
    </div>
  );
}
