
'use client';

import MainLayout from '@/components/layout/main-layout';
import UserAppointmentsList from '@/components/appointments/user-appointments-list';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';


function AppointmentsSkeleton() {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
}


export default function MyTurnosPage() {
    return (
        <MainLayout>
            <div className="flex-1 space-y-8 p-4 md:p-8">
                <PageHeader title="Mis Turnos" />
                <p className="text-muted-foreground -mt-8 mb-8">
                    Aquí puedes ver todas tus reservas de turnos.
                </p>

                <Suspense fallback={<AppointmentsSkeleton />}>
                    <UserAppointmentsList />
                </Suspense>
            </div>
        </MainLayout>
    );
}
