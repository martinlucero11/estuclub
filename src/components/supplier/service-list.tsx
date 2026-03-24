'use client';

import type { Service, Availability } from '@/types/data';
import { Button } from '../ui/button';
import { Calendar, Clock, MagnifyingGlass, AlertTriangle, ArrowRight } from '@phosphor-icons/react';
import { Card } from '../ui/card';
import dynamic from 'next/dynamic';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { MagneticButton } from '../ui/magnetic-button';

const BookingDialog = dynamic(() => import('../booking/booking-dialog'), { ssr: false });

interface ServiceListProps {
  services: Service[];
  availability: Availability | null;
  supplierId: string;
  allowsBooking: boolean;
}

export default function ServiceList({ services, availability, supplierId, allowsBooking }: ServiceListProps) {
  
  if (!allowsBooking) {
    return (
       <Alert className="rounded-2xl border-primary/10 bg-primary/5">
        <AlertTriangle className="h-4 w-4 text-primary" />
        <AlertTitle className="font-black uppercase tracking-tight">Reservas no habilitadas</AlertTitle>
        <AlertDescription className="text-sm opacity-80">
          Este proveedor actualmente no tiene habilitada la opción para reservar turnos.
        </AlertDescription>
      </Alert>
    )
  }

  if (!services || services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-primary/10 p-12 text-center bg-primary/5">
        <MagnifyingGlass className="mx-auto h-12 w-12 text-primary/40" />
        <h3 className="mt-4 text-xl font-black uppercase tracking-tighter">No hay servicios</h3>
        <p className="mt-2 text-sm font-medium text-muted-foreground opacity-70 italic">
          Parece que este local aún no ha configurado sus servicios.
        </p>
      </div>
    );
  }

  if (!availability) {
      return (
          <Alert className="rounded-2xl border-primary/10 bg-primary/5">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <AlertTitle className="font-black uppercase tracking-tight">Horarios no configurados</AlertTitle>
              <AlertDescription className="text-sm opacity-80">
                  Este proveedor tiene servicios pero aún no ha configurado sus horarios.
              </AlertDescription>
          </Alert>
      )
  }

  return (
    <div className="space-y-4">
      {services.map((service, index) => (
        <motion.div
          key={service.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
        >
          <Card className="p-6 rounded-[2rem] border-primary/5 glass glass-dark shadow-premium group transition-all duration-500 hover:shadow-2xl hover:scale-[1.01]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <h3 className="font-black text-xl tracking-tight uppercase group-hover:text-primary transition-colors">{service.name}</h3>
                </div>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed italic opacity-80 line-clamp-2">
                  "{service.description}"
                </p>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-primary/70">
                  <div className="flex items-center gap-1.5 bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                    <Clock className="h-3 w-3" />
                    <span>{service.duration} min</span>
                  </div>
                </div>
              </div>

              <BookingDialog service={service} availability={availability} supplierId={supplierId}>
                <MagneticButton>
                  <Button 
                    onClick={() => haptic.vibrateImpact()}
                    className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 group/btn"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Reservar
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </MagneticButton>
              </BookingDialog>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
