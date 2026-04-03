'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarDays, Clock, Phone, User as UserIcon } from 'lucide-react';
import type { Appointment } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SupplierAgenda() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [month, setMonth] = useState<Date>(new Date());

    // Fetch appointments for the current month (broadly for performance)
    const appointmentsQuery = useMemo(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'appointments').withConverter(createConverter<Appointment>()),
            where('supplierId', '==', user.uid)
        );
    }, [user, firestore]);

    const { data: appointments, isLoading } = useCollection(appointmentsQuery);

    // Filter appointments for the selected date
    const selectedDayAppointments = useMemo(() => {
        if (!appointments || !selectedDate) return [];
        return appointments.filter(apt => {
            const aptDate = (apt.startTime as Timestamp).toDate();
            return isSameDay(aptDate, selectedDate);
        }).sort((a, b) => (a.startTime as Timestamp).toMillis() - (b.startTime as Timestamp).toMillis());
    }, [appointments, selectedDate]);

    // Modifiers for the calendar to highlight days with bookings
    const bookedDays = useMemo(() => {
        if (!appointments) return [];
        return appointments.map(apt => (apt.startTime as Timestamp).toDate());
    }, [appointments]);

    const modifiers = {
        booked: bookedDays,
    };

    const modifiersStyles = {
        booked: {
            fontWeight: 'bold',
            textDecoration: 'underline',
            color: 'hsl(var(--primary))',
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5 h-fit">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        Calendario de Reservas
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center p-0 pb-4">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        month={month}
                        onMonthChange={setMonth}
                        modifiers={modifiers}
                        modifiersStyles={modifiersStyles}
                        className="rounded-md border-none"
                        locale={es}
                    />
                </CardContent>
            </Card>

            <Card className="lg:col-span-7 flex flex-col h-[500px]">
                <CardHeader className="border-b">
                    <CardTitle className="text-lg">
                        {selectedDate ? (
                            format(selectedDate, "eeee d 'de' MMMM", { locale: es })
                        ) : (
                            'Selecciona un día'
                        )}
                        <Badge variant="secondary" className="ml-2">
                            {selectedDayAppointments.length} turnos
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-full p-4">
                        {selectedDayAppointments.length > 0 ? (
                            <div className="space-y-4">
                                {selectedDayAppointments.map(apt => {
                                    const startTime = (apt.startTime as Timestamp).toDate();
                                    const userInitial = apt.userName.charAt(0).toUpperCase();

                                    return (
                                        <div key={apt.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/10 transition-colors">
                                            <Avatar className="h-10 w-10 mt-1">
                                                <AvatarFallback>{userInitial}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold text-base">{apt.userName}</p>
                                                    <Badge variant="outline" className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {format(startTime, 'HH:mm')} hs
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-foreground font-medium">{apt.serviceName}</p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <UserIcon className="h-3 w-3" />
                                                        DNI: {apt.userDni}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {apt.userPhone}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center py-12 opacity-50">
                                <CalendarDays className="h-12 w-12 mb-4" />
                                <p>No hay turnos para este día</p>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

