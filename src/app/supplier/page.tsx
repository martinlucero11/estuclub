'use client';

import MainLayout from '@/components/layout/main-layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  ShieldAlert,
  User,
  CalendarClock,
  BookUser,
  ConciergeBell,
  QrCode,
  History,
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useSupplier } from '@/firebase/auth/use-supplier';
import { Skeleton } from '@/components/ui/skeleton';
import AddServiceForm from '@/components/supplier/add-service-form';
import EditSupplierProfileForm from '@/components/supplier/edit-supplier-profile-form';
import AvailabilityManager from '@/components/supplier/availability-manager';
import AppointmentList from '@/components/supplier/appointment-list';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function SupplierAccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center pt-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="mt-4">Acceso Denegado</CardTitle>
          <CardDescription>
            No tienes permisos para acceder al panel de proveedor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center text-muted-foreground">
            Ponte en contacto con el administrador para solicitar el rol de proveedor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SupplierLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </header>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SupplierPage() {
  const { user } = useUser();
  const { isSupplier, isLoading } = useSupplier();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex-1 space-y-8 p-4 md:p-8">
          <SupplierLoadingSkeleton />
        </div>
      </MainLayout>
    );
  }

  if (!isSupplier) {
    return (
      <MainLayout>
        <SupplierAccessDenied />
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="flex-1 space-y-8 p-4 md:p-8">
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Panel de Proveedor
            </h1>
            <p className="text-muted-foreground">
              Gestiona tus servicios, turnos y revisa los canjes de tus clientes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/supplier/scan">
                <QrCode className="mr-2 h-4 w-4" />
                Escanear QR
              </Link>
            </Button>
          </div>
        </header>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto flex-wrap">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Mi Perfil
            </TabsTrigger>
            <TabsTrigger value="appointments">
              <BookUser className="mr-2 h-4 w-4" />
              Mis Turnos
            </TabsTrigger>
            <TabsTrigger value="availability">
              <CalendarClock className="mr-2 h-4 w-4" />
              Disponibilidad
            </TabsTrigger>
            <TabsTrigger value="add-service">
              <ConciergeBell className="mr-2 h-4 w-4" />
              Añadir Servicio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Editar Perfil de Proveedor</CardTitle>
                <CardDescription>
                  Modifica tu información pública que ven los estudiantes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EditSupplierProfileForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Turnos Reservados</CardTitle>
                <CardDescription>
                  Aquí puedes ver todos los turnos que han reservado contigo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability">
            <Card>
              <CardHeader>
                <CardTitle>Gestionar Disponibilidad</CardTitle>
                <CardDescription>
                  Define tus horarios de trabajo para que los estudiantes puedan reservar turnos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AvailabilityManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-service">
            <Card>
              <CardHeader>
                <CardTitle>Añadir Nuevo Servicio</CardTitle>
                <CardDescription>
                  Crea un servicio que los estudiantes puedan reservar (ej: consulta, clase, etc.).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AddServiceForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
