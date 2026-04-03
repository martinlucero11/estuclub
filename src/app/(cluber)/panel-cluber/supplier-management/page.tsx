'use client';
export const dynamic = 'force-dynamic';

import { useAdmin } from '@/firebase/auth/use-admin';
import { Skeleton } from "@/components/ui/skeleton";
import BackButton from '@/components/layout/back-button';
import AdminAccessDenied from '@/components/admin/admin-access-denied';
import { SupplierTable } from './components/supplier-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagementTable } from './components/user-management-table';
import { SupplierRequestTable } from './components/supplier-request-table';
import { ZombieCleanup } from './components/zombie-cleanup';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SupplierManagementContent() {
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'manage-suppliers';

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
            <AdminAccessDenied title="Acceso Denegado" description="Solo los administradores pueden gestionar los Clubers." />
        </>
      );
  }

  return (
    <div className="space-y-4">
      <BackButton />
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gestión de Clubers</h1>
      </div>
      <p className="text-foreground">
        Gestiona los perfiles de los Clubers existentes o convierte usuarios en nuevos Clubers.
      </p>
      
      <Tabs defaultValue={defaultTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manage-suppliers">Gestionar Clubers</TabsTrigger>
          <TabsTrigger value="requests">Solicitudes</TabsTrigger>
          <TabsTrigger value="convert-user">Convertir Usuario</TabsTrigger>
          <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
        </TabsList>
        <TabsContent value="manage-suppliers" className="mt-4">
          <p className="text-sm text-foreground mb-4">
            Activa o desactiva módulos, visibilidad y estado de destacado de cada Cluber.
          </p>
          <SupplierTable />
        </TabsContent>
        <TabsContent value="convert-user" className="mt-4">
           <p className="text-sm text-foreground mb-4">
            Selecciona un usuario de la lista para asignarle un perfil de Cluber.
          </p>
          <UserManagementTable />
        </TabsContent>
        <TabsContent value="requests" className="mt-4">
           <p className="text-sm text-foreground mb-4">
            Gestiona las solicitudes de usuarios que desean unirse como Clubers.
          </p>
          <SupplierRequestTable />
        </TabsContent>
        <TabsContent value="maintenance" className="mt-4">
           <p className="text-sm text-foreground mb-4">
            Herramientas de limpieza y mantenimiento del sistema.
          </p>
          <ZombieCleanup />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SupplierManagementPage() {
    return (
        <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-2xl" />}>
            <SupplierManagementContent />
        </Suspense>
    );
}


