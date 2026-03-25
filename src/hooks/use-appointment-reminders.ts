'use client';

import { useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollectionOnce } from '@/firebase';
import { collection, query, where, Timestamp, orderBy, limit } from 'firebase/firestore';
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
        
        // Use a stable query that doesn't change every millisecond
        return query(
            collection(firestore, 'appointments').withConverter(createConverter<Appointment>()),
            where('userId', '==', user.uid),
            where('status', '==', 'confirmed'),
            orderBy('startTime', 'asc'),
            limit(10)
        );
    }, [user?.uid, firestore]); // Only depend on UID to keep reference stable

    const { data: appointments } = useCollectionOnce(appointmentsQuery);

    useEffect(() => {
        if (!appointments || appointments.length === 0) return;

        const checkReminders = () => {
            const now = new Date().getTime();
            const oneHourFromNow = now + (60 * 60 * 1000);

            appointments.forEach(app => {
                const startTime = (app.startTime as Timestamp).toMillis();
                
                // Only consider appointments in the next hour
                if (startTime < now || startTime > oneHourFromNow) return;

                const diffMinutes = (startTime - now) / (1000 * 60);

                // Notify if starting in less than 60 minutes
                const storageKey = `reminder_sent_${app.id}`;
                if (diffMinutes > 0 && diffMinutes <= 60 && !sessionStorage.getItem(storageKey)) {
                    toast.info(`¡Recordatorio de Turno!`, {
                        description: `Tu turno para "${app.serviceName}" comienza en ${Math.round(diffMinutes)} minutos.`,
                        duration: 10000,
                        action: {
                            label: 'Ver Turno',
                            onClick: () => window.location.href = `/mis-turnos/view?id=${app.id}`
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
