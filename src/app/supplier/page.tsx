'use client';

import MainLayout from '@/components/layout/main-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  ShieldAlert,
  User,
  CalendarClock,
  BookUser,
  ConciergeBell,
  QrCode,
  History,
  Gift,
  Megaphone,
  List,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupplierProfile } from '@/firebase/auth/use-supplier-profile';
import { Skeleton } from '@/components/ui/skeleton';
import AddServiceForm from '@/components/supplier/add-service-form';
import EditSupplierProfileForm from '@/components/supplier/edit-supplier-profile-form';
import AvailabilityManager from '@/components/supplier/availability-manager';
import AppointmentList from '@/components/supplier/appointment-list';
import RedemptionList from '@/components/supplier/redemption-list';
import AddPerkForm from '@/components/admin/add-perk-form';
import BenefitAdminList from '@/components/admin/benefit-admin-list';
import AddAnnouncementForm from '@/components/announcements/add-announcement-form';
import AnnouncementAdminList from '@/components/admin/announcement-admin-list';
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
  const { supplierProfile, isLoading } = useSupplierProfile();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex-1 space-y-8 p-4 md:p-8">
          <SupplierLoadingSkeleton />
        </div>
      </MainLayout>
    );
  }

  if (!supplierProfile) {
    return (
      <MainLayout>
        <SupplierAccessDenied />
      </MainLayout>
    );
  }

  const isInstitution = supplierProfile.type === 'Institucion';
  const canBook = supplierProfile.allowsBooking;
  const defaultTab = 'profile';

  return (
    <MainLayout>
      <div className="flex-1 space-y-8 p-4 md:p-8">
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Panel de Proveedor
            </h1>
            <p className="text-muted-foreground">
              Gestiona tu perfil, beneficios, y servicios en la plataforma.
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

        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="grid w-full h-auto flex-wrap grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
            <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Mi Perfil</TabsTrigger>
            <TabsTrigger value="manage-benefits"><List className="mr-2 h-4 w-4" />Beneficios</TabsTrigger>
            <TabsTrigger value="add-benefit"><Gift className="mr-2 h-4 w-4" />Añadir Beneficio</TabsTrigger>
            <TabsTrigger value="redemptions"><History className="mr-2 h-4 w-4" />Canjes</TabsTrigger>
            
            {isInstitution && (
              <>
                <TabsTrigger value="manage-announcements"><List className="mr-2 h-4 w-4" />Anuncios</TabsTrigger>
                <TabsTrigger value="add-announcement"><Megaphone className="mr-2 h-4 w-4" />Añadir Anuncio</TabsTrigger>
              </>
            )}
            
            {canBook && (
              <>
                <TabsTrigger value="appointments"><BookUser className="mr-2 h-4 w-4" />Mis Turnos</TabsTrigger>
                <TabsTrigger value="availability"><CalendarClock className="mr-2 h-4 w-4" />Disponibilidad</TabsTrigger>
                <TabsTrigger value="add-service"><ConciergeBell className="mr-2 h-4 w-4" />Añadir Servicio</TabsTrigger>
              </>
            )}
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Editar Perfil de Proveedor</CardTitle>
                <CardDescription>
                  Modifica tu información pública que ven los estudiantes.
                </CardDescription>
              </CardHeader>
              <CardContent><EditSupplierProfileForm /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage-benefits">
            <Card>
              <CardHeader>
                <CardTitle>Gestionar Beneficios</CardTitle>
                <CardDescription>Edita o elimina los beneficios que has creado.</CardDescription>
              </CardHeader>
              <CardContent>
                <BenefitAdminList supplierId={supplierProfile.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-benefit">
            <Card>
              <CardHeader>
                <CardTitle>Añadir Nuevo Beneficio</CardTitle>
                <CardDescription>Crea un nuevo beneficio para los estudiantes.</CardDescription>
              </CardHeader>
              <CardContent><AddPerkForm /></CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="redemptions">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Canjes</CardTitle>
                <CardDescription>Revisa todos los beneficios que los estudiantes han canjeado en tu comercio.</CardDescription>
              </CardHeader>
              <CardContent><RedemptionList /></CardContent>
            </Card>
          </TabsContent>

          {isInstitution && (
            <>
              <TabsContent value="manage-announcements">
                <Card>
                  <CardHeader>
                    <CardTitle>Gestionar Anuncios</CardTitle>
                    <CardDescription>Edita o elimina los anuncios que has creado.</CardDescription>
                  </CardHeader>
                  <CardContent><AnnouncementAdminList authorId={supplierProfile.id} /></CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="add-announcement">
                <Card>
                  <CardHeader>
                    <CardTitle>Publicar Nuevo Anuncio</CardTitle>
                    <CardDescription>Comparte novedades con la comunidad estudiantil.</CardDescription>
                  </CardHeader>
                  <CardContent><AddAnnouncementForm /></CardContent>
                </Card>
              </TabsContent>
            </>
          )}

          {canBook && (
            <>
              <TabsContent value="appointments">
                <Card>
                  <CardHeader>
                    <CardTitle>Turnos Reservados</CardTitle>
                    <CardDescription>Aquí puedes ver todos los turnos que han reservado contigo.</CardDescription>
                  </CardHeader>
                  <CardContent><AppointmentList /></CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="availability">
                <Card>
                  <CardHeader>
                    <CardTitle>Gestionar Disponibilidad</CardTitle>
                    <CardDescription>Define tus horarios de trabajo para que los estudiantes puedan reservar turnos.</CardDescription>
                  </CardHeader>
                  <CardContent><AvailabilityManager /></CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="add-service">
                <Card>
                  <CardHeader>
                    <CardTitle>Añadir Nuevo Servicio</CardTitle>
                    <CardDescription>Crea un servicio que los estudiantes puedan reservar (ej: consulta, clase, etc.).</CardDescription>
                  </CardHeader>
                  <CardContent><AddServiceForm /></CardContent>
                </Card>
              </TabsContent>
            </>
          )}

        </Tabs>
      </div>
    </MainLayout>
  );
}
