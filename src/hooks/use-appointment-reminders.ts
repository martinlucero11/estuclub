'use client';

import { useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { createConverter } from '@/lib/firestore-converter';
import type { Appointment } from '@/types/data';

/**
 * Hook to monitor upcoming appointments and show toast reminders
 */
export function useAppointmentReminders() {
    const { user } = useUser();
    const firestore = useFirestore();

    const appointmentsQuery = useMemo(() => {
        if (!user || !firestore) return null;
        
        const now = new Date();
        // Look ahead 24 hours
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        
        return query(
            collection(firestore, 'appointments').withConverter(createConverter<Appointment>()),
            where('userId', '==', user.uid),
            where('status', '==', 'confirmed'),
            where('startTime', '>=', Timestamp.fromDate(now)),
            where('startTime', '<=', Timestamp.fromDate(tomorrow))
        );
    }, [user, firestore]);

    const { data: appointments } = useCollection(appointmentsQuery);

    useEffect(() => {
        if (!appointments || appointments.length === 0) return;

        const checkReminders = () => {
            const now = new Date().getTime();
            appointments.forEach(app => {
                const startTime = (app.startTime as Timestamp).toMillis();
                const diffMinutes = (startTime - now) / (1000 * 60);

                // Notify if starting in less than 60 minutes
                const storageKey = `reminder_sent_${app.id}`;
                if (diffMinutes > 0 && diffMinutes <= 60 && !sessionStorage.getItem(storageKey)) {
                    toast.info(`¡Recordatorio de Turno!`, {
                        description: `Tu turno para "${app.serviceName}" comienza en ${Math.round(diffMinutes)} minutos.`,
                        duration: 10000,
                        action: {
                            label: 'Ver Turno',
                            onClick: () => window.location.href = `/mis-turnos/${app.id}`
                        }
                    });
                    // Mark as notified for this session
                    sessionStorage.setItem(storageKey, 'true');
                }
            });
        };

        // Check immediately and then periodically
        checkReminders();
        const interval = setInterval(checkReminders, 1000 * 60 * 10); // Check every 10 mins
        
        return () => clearInterval(interval);
    }, [appointments]);
}
