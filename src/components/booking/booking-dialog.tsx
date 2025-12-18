'use client';

import { useState, useMemo } from 'react';
import { add, format, startOfDay, getDay, set } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, writeBatch, query, where, Timestamp } from 'firebase/firestore';
import type { Service, Availability, Appointment } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '../ui/dialog';

interface BookingDialogProps {
  service: Service;
  availability: Availability;
  supplierId: string;
  children: React.ReactNode;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
}

export default function BookingDialog({ service, availability, supplierId, children }: BookingDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  const appointmentsQuery = useMemoFirebase(() => {
    if (!supplierId || !selectedDate) return null;
    const start = startOfDay(selectedDate);
    const end = add(start, { days: 1 });
    return query(
        collection(firestore, `roles_supplier/${supplierId}/appointments`),
        where('startTime', '>=', start),
        where('startTime', '<', end)
    );
}, [supplierId, selectedDate, firestore]);

  const { data: existingAppointments } = useCollection<Appointment>(appointmentsQuery);

  const availableSlots = useMemo(() => {
    if (!selectedDate || !availability?.schedule) return [];

    const dayOfWeek = dayNames[getDay(selectedDate)];
    const daySchedule = availability.schedule[dayOfWeek];

    if (!daySchedule || !daySchedule.active) return [];

    const slots = [];
    const [startH, startM] = daySchedule.startTime.split(':').map(Number);
    const [endH, endM] = daySchedule.endTime.split(':').map(Number);

    let currentTime = set(selectedDate, { hours: startH, minutes: startM, seconds: 0, milliseconds: 0 });
    const endTime = set(selectedDate, { hours: endH, minutes: endM, seconds: 0, milliseconds: 0 });

    while (add(currentTime, { minutes: service.duration }) <= endTime) {
      const slotEnd = add(currentTime, { minutes: service.duration });
      
      const isBooked = existingAppointments?.some(apt => {
          const aptStart = (apt.startTime as any).toDate();
          const aptEnd = (apt.endTime as any).toDate();
          return (currentTime < aptEnd && slotEnd > aptStart);
      });

      if (!isBooked) {
        slots.push(currentTime);
      }
      currentTime = add(currentTime, { minutes: service.duration });
    }
    return slots;
  }, [selectedDate, availability, service, existingAppointments, dayNames]);

  const handleBooking = async () => {
    if (!user || !userProfile || !selectedSlot) {
        toast({ variant: 'destructive', title: 'Error', description: 'Faltan datos para realizar la reserva.' });
        return;
    }
    setIsBooking(true);
    try {
        const batch = writeBatch(firestore);
        const appointmentRef = doc(collection(firestore, `roles_supplier/${supplierId}/appointments`));
        
        const appointmentData: Appointment = {
            id: appointmentRef.id,
            userId: user.uid,
            userName: `${userProfile.firstName} ${userProfile.lastName}`,
            userDni: userProfile.dni,
            userPhone: userProfile.phone,
            serviceId: service.id,
            serviceName: service.name,
            startTime: selectedSlot,
            endTime: add(selectedSlot, { minutes: service.duration }),
            status: 'confirmed',
        };

        batch.set(appointmentRef, appointmentData);
        
        await batch.commit();
        
        toast({ title: '¡Turno Confirmado!', description: 'Tu reserva se ha realizado con éxito.' });
        setIsOpen(false);
        setSelectedSlot(null);
        setSelectedDate(undefined);

    } catch (error) {
        console.error("Booking error:", error);
        toast({ variant: 'destructive', title: 'Error al reservar', description: 'No se pudo completar la reserva. Intenta de nuevo.' });
    } finally {
        setIsBooking(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
        setSelectedDate(startOfDay(date));
    } else {
        setSelectedDate(undefined);
    }
    setSelectedSlot(null);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-4xl grid-cols-1 md:grid-cols-2">
             <DialogHeader className="md:col-span-2">
                <DialogTitle>Reservar: {service.name}</DialogTitle>
                <DialogDescription>
                    Selecciona una fecha y un horario para tu turno.
                </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
                 <label className="text-sm font-medium">1. Selecciona una fecha</label>
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < startOfDay(new Date())}
                    className="rounded-md border"
                    locale={es}
                    weekStartsOn={1}
                />
            </div>
            <div className='space-y-4'>
                <label className="text-sm font-medium">2. Selecciona un horario</label>
                {selectedDate ? (
                    <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-2">
                    {availableSlots.length > 0 ? availableSlots.map(slot => (
                        <Button 
                            key={slot.toISOString()} 
                            variant={selectedSlot?.getTime() === slot.getTime() ? 'default' : 'outline'}
                            onClick={() => setSelectedSlot(slot)}
                        >
                        {format(slot, 'HH:mm')}
                        </Button>
                    )) : (
                        <p className='col-span-3 text-sm text-muted-foreground text-center p-4'>No hay turnos disponibles para este día.</p>
                    )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground border-2 border-dashed rounded-md p-4">
                        <p>Selecciona una fecha para ver los horarios.</p>
                    </div>
                )}
            </div>
             <DialogFooter className="md:col-span-2">
                {selectedSlot && (
                    <div className='w-full flex justify-between items-center'>
                         <p className="text-sm text-muted-foreground">
                            Turno seleccionado: <strong className="text-foreground">{format(selectedSlot, "eeee, d 'de' MMMM 'a las' HH:mm", { locale: es })}</strong>
                        </p>
                        <Button onClick={handleBooking} disabled={isBooking || !user}>
                            {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {user ? 'Confirmar Reserva' : 'Inicia sesión para reservar'}
                        </Button>
                    </div>
                )}
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
