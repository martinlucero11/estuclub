
'use client';

import MainLayout from '@/components/layout/main-layout';
import AddPerkForm from '@/components/admin/add-perk-form';
import AddAnnouncementForm from '@/components/announcements/add-announcement-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldAlert, List, PlusCircle, Briefcase, Users, History, QrCode } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BenefitAdminList from '@/components/admin/benefit-admin-list';
import AnnouncementAdminList from '@/components/admin/announcement-admin-list';
import { useAdmin } from '@/firebase/auth/use-admin';
import { Skeleton } from '@/components/ui/skeleton';
import AddSupplierForm from '@/components/admin/add-supplier-form';
import SupplierList from '@/components/admin/supplier-list';
import AllRedemptionsList from '@/components/admin/all-redemptions-list';
import QrScanner from '@/components/supplier/qr-scanner';


function AdminAccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center pt-16">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">Acceso Denegado</CardTitle>
                    <CardDescription>
                        No tienes permisos para acceder al panel de administración.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-center text-muted-foreground">
                        Ponte en contacto con el administrador de la aplicación para solicitar acceso.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

function AdminLoadingSkeleton() {
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
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4 rounded-md border p-4">
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


export default function AdminPage() {
    const { isAdmin, isLoading } = useAdmin();
    
    if (isLoading) {
        return (
             <MainLayout>
                <div className="flex-1 space-y-8 p-4 md:p-8">
                    <AdminLoadingSkeleton />
                </div>
            </MainLayout>
        );
    }

    if (!isAdmin) {
        return (
             <MainLayout>
                <AdminAccessDenied />
            </MainLayout>
        );
    }

  return (
    <MainLayout>
      <div className="flex-1 space-y-8 p-4 md:p-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">
            Gestiona los beneficios, anuncios y proveedores de la plataforma.
          </p>
        </header>

        <Tabs defaultValue="manage-benefits" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 h-auto flex-wrap">
            <TabsTrigger value="manage-benefits">
              <List className="mr-2 h-4 w-4" />
              Beneficios
            </TabsTrigger>
             <TabsTrigger value="add-benefit">
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Beneficio
            </TabsTrigger>
            <TabsTrigger value="manage-announcements">
                <List className="mr-2 h-4 w-4" />
              Anuncios
            </TabsTrigger>
            <TabsTrigger value="add-announcement">
                <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Anuncio
            </TabsTrigger>
            <TabsTrigger value="manage-suppliers">
              <Briefcase className="mr-2 h-4 w-4" />
              Proveedores
            </TabsTrigger>
            <TabsTrigger value="add-supplier">
              <Users className="mr-2 h-4 w-4" />
              Añadir Proveedor
            </TabsTrigger>
            <TabsTrigger value="my-redemptions">
              <History className="mr-2 h-4 w-4" />
              Mis Canjes
            </TabsTrigger>
            <TabsTrigger value="scan-qr">
                <QrCode className="mr-2 h-4 w-4" />
                Escanear QR
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manage-benefits">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Beneficios</CardTitle>
                <CardDescription>Edita o elimina los beneficios existentes.</CardDescription>
              </CardHeader>
              <CardContent>
                <BenefitAdminList />
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

          <TabsContent value="manage-announcements">
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Anuncios</CardTitle>
                    <CardDescription>Edita o elimina los anuncios existentes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AnnouncementAdminList />
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

           <TabsContent value="manage-suppliers">
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Proveedores</CardTitle>
                    <CardDescription>Gestiona los proveedores de beneficios.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SupplierList />
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-supplier">
            <Card>
                <CardHeader>
                    <CardTitle>Añadir Nuevo Proveedor</CardTitle>
                    <CardDescription>Otorga a un usuario el rol de proveedor.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AddSupplierForm />
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-redemptions">
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Mis Canjes</CardTitle>
                    <CardDescription>Revisa todos los canjes asociados a tu cuenta de proveedor.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AllRedemptionsList />
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scan-qr">
            <Card>
                <CardHeader>
                    <CardTitle>Escanear Código QR de Canje</CardTitle>
                    <CardDescription>
                        Apunta la cámara al código QR del estudiante para validar el canje.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <QrScanner userIsAdmin={isAdmin} />
                </CardContent>
            </Card>
          </TabsContent>
          
        </Tabs>
      </div>
    </MainLayout>
  );
}
