'use client';

import { useAdmin } from '@/firebase/auth/use-admin';
import { Skeleton } from "@/components/ui/skeleton";
import BackButton from '@/components/layout/back-button';
import AdminAccessDenied from '@/components/admin/admin-access-denied';
import { SupplierTable } from './components/supplier-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagementTable } from './components/user-management-table';

export default function SupplierManagementPage() {
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();

  if (isAdminLoading) {
      return (
        <div className="space-y-4">
            <BackButton />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-64" />
            <div className="space-y-2 pt-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        </div>
      );
  }

  if (!isAdmin) {
      return (
        <>
            <BackButton />
            <AdminAccessDenied title="Acceso Denegado" description="Solo los administradores pueden gestionar los proveedores." />
        </>
      );
  }

  return (
    <div className="space-y-4">
      <BackButton />
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gestión de Clubers</h1>
      </div>
      <p className="text-muted-foreground">
        Gestiona los perfiles de los Clubers existentes o convierte usuarios en nuevos Clubers.
      </p>
      
      <Tabs defaultValue="manage-suppliers">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage-suppliers">Gestionar Clubers</TabsTrigger>
          <TabsTrigger value="convert-user">Convertir Usuario a Cluber</TabsTrigger>
        </TabsList>
        <TabsContent value="manage-suppliers" className="mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Activa o desactiva módulos, visibilidad y estado de destacado de cada Cluber.
          </p>
          <SupplierTable />
        </TabsContent>
        <TabsContent value="convert-user" className="mt-4">
           <p className="text-sm text-muted-foreground mb-4">
            Selecciona un usuario de la lista para asignarle un perfil de Cluber.
          </p>
          <UserManagementTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
