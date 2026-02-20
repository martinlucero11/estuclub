
'use client';

import { PageHeader } from '@/components/ui/page-header';
import AddPerkForm from '@/components/admin/add-perk-form';
import AddAnnouncementForm from '@/components/announcements/add-announcement-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { List, PlusCircle, Briefcase, Users, History, QrCode, Shapes, Layers } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BenefitAdminList from '@/components/admin/benefit-admin-list';
import AnnouncementAdminList from '@/components/admin/announcement-admin-list';
import { useAdmin } from '@/firebase/auth/use-admin';
import { Skeleton } from '@/components/ui/skeleton';
import AddSupplierForm from '@/components/admin/add-supplier-form';
import SupplierList from '@/components/admin/supplier-list';
import AllRedemptionsList from '@/components/admin/all-redemptions-list';
import QrScanner from '@/components/supplier/qr-scanner';
import { CategoryTable } from '../dashboard/categories/components/category-table';
import { HomeSectionTable } from '@/components/admin/home-sections/home-section-table';
import MainLayout from '@/components/layout/main-layout';
import AdminAccessDenied from '@/components/admin/admin-access-denied';


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
                <AdminAccessDenied title="Acceso Denegado" description="No tienes permisos para acceder al panel de administración." />
            </MainLayout>
        );
    }

  return (
    <MainLayout>
      <div className="flex-1 space-y-8 p-4 md:p-8">
        <PageHeader title="Panel de Administración" />
        <p className="text-muted-foreground -mt-8 mb-8">
            Gestiona los beneficios, anuncios y proveedores de la plataforma.
        </p>

        <Tabs defaultValue="manage-benefits" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:grid-cols-10 h-auto flex-wrap">
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
             <TabsTrigger value="manage-categories">
              <Shapes className="mr-2 h-4 w-4" />
              Categorías
            </TabsTrigger>
            <TabsTrigger value="manage-home-sections">
              <Layers className="mr-2 h-4 w-4" />
              Home
            </TabsTrigger>
            <TabsTrigger value="my-redemptions">
              <History className="mr-2 h-4 w-4" />
              Canjes
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

            <TabsContent value="manage-categories">
                <Card>
                    <CardHeader>
                        <CardTitle>Gestionar Categorías</CardTitle>
                        <CardDescription>Crea, edita y elimina las categorías que agrupan los beneficios.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CategoryTable />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="manage-home-sections">
                <Card>
                    <CardHeader>
                        <CardTitle>Gestionar Secciones de la Home</CardTitle>
                        <CardDescription>Organiza el contenido que se muestra en la página de inicio.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <HomeSectionTable />
                    </CardContent>
                </Card>
            </TabsContent>

          <TabsContent value="my-redemptions">
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Canjes de Proveedor</CardTitle>
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
