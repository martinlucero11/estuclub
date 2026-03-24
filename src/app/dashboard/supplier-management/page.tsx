
'use client';

import { useAdmin } from '@/firebase/auth/use-admin';
import { Skeleton } from "@/components/ui/skeleton";
import BackButton from '@/components/layout/back-button';
import AdminAccessDenied from '@/components/admin/admin-access-denied';
import { SupplierTable } from './components/supplier-table';

export default function SupplierManagementPage() {
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();

  if (isAdminLoading) {
      return (
        <div className="space-y-4">
            <BackButton />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-64" />
            <div className="space-y-2 pt-4">
                {[...Array(5)].Map((_, i) => (
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
          <h1 className="text-3xl font-bold">Gestión de Proveedores</h1>
      </div>
      <p className="text-muted-foreground">
        Activa o desactiva módulos y la visibilidad de cada proveedor.
      </p>
      <SupplierTable />
    </div>
  );
}

