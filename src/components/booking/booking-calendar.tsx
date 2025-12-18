'use client';

import { useState, useMemo } from 'react';
import { add, format, set, startOfDay, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, writeBatch, query, where, Timestamp } from 'firebase/firestore';
import type { Service, Availability, Appointment } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Loader2, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';

interface BookingCalendarProps {
  services: Service[];
  availability: Availability;
  supplierId: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
}

export default function BookingCalendar({ services, availability, supplierId }: BookingCalendarProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(services[0]?.id);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
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
    if (!selectedDate || !selectedServiceId || !availability?.schedule) return [];

    const dayOfWeek = dayNames[getDay(selectedDate)];
    const daySchedule = availability.schedule[dayOfWeek];

    if (!daySchedule || !daySchedule.active) return [];

    const selectedService = services.find(s => s.id === selectedServiceId);
    if (!selectedService) return [];

    const slots = [];
    const [startH, startM] = daySchedule.startTime.split(':').map(Number);
    const [endH, endM] = daySchedule.endTime.split(':').map(Number);

    let currentTime = set(selectedDate, { hours: startH, minutes: startM, seconds: 0, milliseconds: 0 });
    const endTime = set(selectedDate, { hours: endH, minutes: endM, seconds: 0, milliseconds: 0 });

    while (add(currentTime, { minutes: selectedService.duration }) <= endTime) {
      const slotEnd = add(currentTime, { minutes: selectedService.duration });
      
      const isBooked = existingAppointments?.some(apt => {
          const aptStart = (apt.startTime as any).toDate();
          const aptEnd = (apt.endTime as any).toDate();
          // Check for overlap
          return (currentTime < aptEnd && slotEnd > aptStart);
      });

      if (!isBooked) {
        slots.push(currentTime);
      }
      currentTime = add(currentTime, { minutes: selectedService.duration }); // Or some other interval
    }
    return slots;
  }, [selectedDate, selectedServiceId, availability, services, existingAppointments, dayNames]);

  const handleBooking = async () => {
    if (!user || !userProfile || !selectedSlot || !selectedServiceId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Faltan datos para realizar la reserva.' });
        return;
    }
    setIsBooking(true);
    try {
        const batch = writeBatch(firestore);
        const appointmentRef = doc(collection(firestore, `roles_supplier/${supplierId}/appointments`));
        const selectedService = services.find(s => s.id === selectedServiceId);
        
        const appointmentData: Appointment = {
            id: appointmentRef.id,
            userId: user.uid,
            userName: `${userProfile.firstName} ${userProfile.lastName}`,
            userDni: userProfile.dni,
            userPhone: userProfile.phone,
            serviceId: selectedServiceId,
            serviceName: selectedService?.name || 'Servicio Desconocido',
            startTime: selectedSlot,
            endTime: add(selectedSlot, { minutes: selectedService?.duration || 0 }),
            status: 'confirmed',
        };

        batch.set(appointmentRef, appointmentData);
        // We can add a user-side copy of the appointment if needed
        // const userAppointmentRef = doc(firestore, `users/${user.uid}/appointments`, appointmentRef.id);
        // batch.set(userAppointmentRef, appointmentData);
        
        await batch.commit();
        
        toast({ title: '¡Turno Confirmado!', description: 'Tu reserva se ha realizado con éxito.' });
        setIsConfirming(false);
        setSelectedSlot(null);

    } catch (error) {
        console.error("Booking error:", error);
        toast({ variant: 'destructive', title: 'Error al reservar', description: 'No se pudo completar la reserva. Intenta de nuevo.' });
    } finally {
        setIsBooking(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  if (!services || services.length === 0) {
      return <Alert><AlertTitle>Sin Servicios</AlertTitle><AlertDescription>Este proveedor no tiene servicios disponibles para reservar en este momento.</AlertDescription></Alert>
  }
  
  const selectedService = services.find(s => s.id === selectedServiceId);

  return (
    <Card>
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className='space-y-4'>
            <div>
              <label className="text-sm font-medium">1. Selecciona un servicio</label>
              <Select onValueChange={setSelectedServiceId} defaultValue={selectedServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>{service.name} ({service.duration} min)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
                 <label className="text-sm font-medium">2. Selecciona una fecha</label>
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
        </div>
        <div className='space-y-4'>
          <label className="text-sm font-medium">3. Selecciona un horario</label>
          {selectedDate ? (
            <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
              {availableSlots.length > 0 ? availableSlots.map(slot => (
                <Button 
                    key={slot.toISOString()} 
                    variant={selectedSlot?.getTime() === slot.getTime() ? 'default' : 'outline'}
                    onClick={() => setSelectedSlot(slot)}
                >
                  {format(slot, 'HH:mm')}
                </Button>
              )) : (
                <p className='col-span-3 text-sm text-muted-foreground text-center p-4'>No hay turnos disponibles para este día o servicio.</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground border-2 border-dashed rounded-md p-4">
                <p>Selecciona una fecha para ver los horarios disponibles.</p>
            </div>
          )}

          {selectedSlot && (
              <Button className='w-full' onClick={() => setIsConfirming(true)} disabled={!user}>
                  {user ? 'Reservar este turno' : 'Inicia sesión para reservar'}
              </Button>
          )}
        </div>
        
        {/* Confirmation Dialog */}
        <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Reserva</DialogTitle>
                    <DialogDescription>
                        Estás a punto de reservar el siguiente turno.
                    </DialogDescription>
                </DialogHeader>
                <div className='space-y-4 py-4'>
                    <p><strong>Servicio:</strong> {selectedService?.name}</p>
                    <p><strong>Fecha:</strong> {selectedSlot && format(selectedSlot, 'eeee, d \'de\' MMMM', { locale: es })}</p>
                    <p><strong>Hora:</strong> {selectedSlot && format(selectedSlot, 'HH:mm')}</p>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsConfirming(false)}>Cancelar</Button>
                    <Button onClick={handleBooking} disabled={isBooking}>
                        {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
