
'use client';

import BackButton from '@/components/layout/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import AddServiceForm from '@/components/supplier/add-service-form';
import AvailabilityManager from '@/components/supplier/availability-manager';
import AppointmentList from '@/components/supplier/appointment-list';
import SupplierAgenda from '@/components/supplier/supplier-agenda';
import ServiceManager from '@/components/supplier/service-manager';

export default function PanelCluberAppointmentsPage() {
  return (
    <div className="space-y-4">
        <BackButton />
        <h1 className="text-3xl font-bold">Gestión de Turnos</h1>
        <p className="text-muted-foreground">
            Administra tus servicios, horarios de atención y las reservas de tus clientes.
        </p>

        <Tabs defaultValue="appointments" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="appointments">Próximos Turnos</TabsTrigger>
                <TabsTrigger value="agenda">Mi Agenda</TabsTrigger>
                <TabsTrigger value="services">Mis Servicios</TabsTrigger>
                <TabsTrigger value="availability">Mi Disponibilidad</TabsTrigger>
            </TabsList>
            <TabsContent value="appointments">
                <Card>
                    <CardHeader>
                        <CardTitle>Próximos Turnos</CardTitle>
                        <CardDescription>Estos son los turnos que tienes programados próximamente.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AppointmentList />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="agenda">
                 <SupplierAgenda />
            </TabsContent>
            <TabsContent value="services">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mis Servicios</CardTitle>
                            <CardDescription>Visualiza y gestiona los servicios que ofreces.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ServiceManager />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Añadir Nuevo Servicio</CardTitle>
                            <CardDescription>Crea los servicios que ofreces para que los usuarios puedan reservarlos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AddServiceForm />
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
            <TabsContent value="availability">
                <Card>
                    <CardHeader>
                        <CardTitle>Configurar Horarios</CardTitle>
                        <CardDescription>Define tus días y horas de trabajo para que los usuarios puedan reservar turnos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AvailabilityManager />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
