
'use client';

import MainLayout from '@/components/layout/main-layout';
import AddPerkForm from '@/components/admin/add-perk-form';
import AddAnnouncementForm from '@/components/announcements/add-announcement-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlusCircle, ShieldAlert, List, ConciergeBell, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupplier } from '@/firebase/auth/use-supplier';
import { Skeleton } from '@/components/ui/skeleton';
import AddServiceForm from '@/components/supplier/add-service-form';
import EditSupplierProfileForm from '@/components/supplier/edit-supplier-profile-form';

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
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Panel de Proveedor
          </h1>
          <p className="text-muted-foreground">
            Publica y gestiona beneficios, servicios y anuncios para la comunidad estudiantil.
          </p>
        </header>

        <Tabs defaultValue="add-benefit" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto flex-wrap">
             <TabsTrigger value="profile">
                <User className="mr-2 h-4 w-4" />
                Mi Perfil
            </TabsTrigger>
             <TabsTrigger value="add-benefit">
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Beneficio
            </TabsTrigger>
             <TabsTrigger value="add-service">
                <ConciergeBell className="mr-2 h-4 w-4" />
                Añadir Servicio
            </TabsTrigger>
            <TabsTrigger value="add-announcement">
                <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Anuncio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Editar Perfil de Proveedor</CardTitle>
                <CardDescription>Modifica tu información pública que ven los estudiantes.</CardDescription>
              </CardHeader>
              <CardContent>
                <EditSupplierProfileForm />
              </CardContent>
            </Card>
          </TabsContent>
          
           <TabsContent value="add-benefit">
            <Card>
              <CardHeader>
                <CardTitle>Añadir Nuevo Beneficio</CardTitle>
                <CardDescription>Rellena el formulario para añadir un nuevo beneficio a la plataforma.</CardDescription>
              </CardHeader>
              <CardContent>
                <AddPerkForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-service">
            <Card>
              <CardHeader>
                <CardTitle>Añadir Nuevo Servicio</CardTitle>
                <CardDescription>Crea un servicio que los estudiantes puedan reservar (ej: consulta, clase, etc.).</CardDescription>
              </CardHeader>
              <CardContent>
                <AddServiceForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-announcement">
            <Card>
                <CardHeader>
                    <CardTitle>Publicar un Nuevo Anuncio</CardTitle>
                    <CardDescription>Comparte algo con la comunidad estudiantil.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AddAnnouncementForm />
                </CardContent>
            </Card>
          </TabsContent>
          
        </Tabs>
      </div>
    </MainLayout>
  );
}
