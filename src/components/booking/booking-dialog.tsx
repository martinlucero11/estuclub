
'use client';

import { useState, useMemo } from 'react';
import { add, format, startOfDay, getDay, set } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, addDoc, query, where, Timestamp, serverTimestamp } from 'firebase/firestore';
import type { Service, Availability, Appointment } from '@/types/data';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '../ui/dialog';
import { createConverter } from '@/lib/firestore-converter';

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

  const userProfileRef = useMemo(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  const appointmentsQuery = useMemo(() => {
    if (!supplierId || !selectedDate) return null;
    const start = startOfDay(selectedDate);
    const end = add(start, { days: 1 });
    return query(
        collection(firestore, `appointments`).withConverter(createConverter<Appointment>()),
        where('supplierId', '==', supplierId),
        where('startTime', '>=', start),
        where('startTime', '<', end)
    );
}, [supplierId, selectedDate, firestore]);

  const { data: existingAppointments } = useCollection(appointmentsQuery);

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
        const appointmentsRef = collection(firestore, 'appointments');
        
        const appointmentData: Omit<Appointment, 'id'> = {
            userId: user.uid,
            userName: `${userProfile.firstName} ${userProfile.lastName}`,
            userDni: userProfile.dni,
            userPhone: userProfile.phone,
            serviceId: service.id,
            serviceName: service.name,
            supplierId: supplierId,
            startTime: selectedSlot,
            endTime: add(selectedSlot, { minutes: service.duration }),
            status: 'confirmed',
            createdAt: serverTimestamp(),
        };

        await addDoc(appointmentsRef, appointmentData);
        
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
        <DialogContent className="max-w-3xl">
             <DialogHeader>
                <DialogTitle>Reservar: {service.name}</DialogTitle>
                <DialogDescription>
                    Selecciona una fecha y un horario para tu turno.
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col md:flex-row gap-8 sm:gap-12 justify-center mt-6">
                <div className="flex-1 max-w-[350px] mx-auto md:mx-0">
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

                <div className="flex-1 flex flex-col gap-4">
                     <h3 className="font-semibold text-lg text-center md:text-left">
                        {selectedDate 
                            ? `Horarios para el ${format(selectedDate, "d 'de' MMMM", { locale: es })}`
                            : 'Selecciona un día'}
                    </h3>
                    {selectedDate ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-2">
                        {availableSlots.length > 0 ? availableSlots.map(slot => (
                            <Button 
                                key={slot.toISOString()} 
                                variant={selectedSlot?.getTime() === slot.getTime() ? 'default' : 'outline'}
                                onClick={() => setSelectedSlot(slot)}
                                className="w-full"
                            >
                            {format(slot, 'HH:mm')}
                            </Button>
                        )) : (
                            <p className='col-span-full text-sm text-muted-foreground text-center p-4'>No hay turnos disponibles para este día.</p>
                        )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground border-2 border-dashed rounded-md p-4">
                            <p>Selecciona un día para ver los horarios.</p>
                        </div>
                    )}
                </div>
            </div>

             <DialogFooter className="pt-6">
                 <div className='w-full flex flex-col sm:flex-row justify-between items-center gap-4'>
                    <p className="text-sm text-muted-foreground text-center sm:text-left">
                        {selectedSlot 
                            ? <>Turno seleccionado: <strong className="text-foreground">{format(selectedSlot, "eeee, d 'de' MMMM 'a las' HH:mm", { locale: es })}</strong></>
                            : "Por favor, selecciona una fecha y hora."
                        }
                    </p>
                    <Button 
                        onClick={handleBooking} 
                        disabled={isBooking || !user || !selectedDate || !selectedSlot}
                        className="w-full sm:w-auto"
                    >
                        {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {user ? 'Confirmar Reserva' : 'Inicia sesión para reservar'}
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
