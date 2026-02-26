
'use client';

import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { SupplierProfile } from "@/types/data";
import { SupplierTable } from "./components/supplier-table";
import { Skeleton } from "@/components/ui/skeleton";
import BackButton from '@/components/layout/back-button';
import { useMemo } from 'react';
import { createConverter } from '@/lib/firestore-converter';
import { useAdmin } from '@/firebase/auth/use-admin';
import AdminAccessDenied from '@/components/admin/admin-access-denied';


export default function SupplierManagementPage() {
  const firestore = useFirestore();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();

  const suppliersQuery = useMemo(
    () => query(collection(firestore, "roles_supplier").withConverter(createConverter<SupplierProfile>()), orderBy("name")),
    [firestore]
  );

  const { data: suppliers, isLoading: isSuppliersLoading, error } = useCollection(suppliersQuery);

  if (isAdminLoading) {
      return <div className="space-y-4">
        <BackButton />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-64" />
        <div className="space-y-2 pt-4">
            {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
            ))}
        </div>
      </div>
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
        Activa o desactiva módulos de funcionalidades para cada proveedor.
      </p>
      
      {isSuppliersLoading ? (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
            ))}
        </div>
      ) : error ? (
        <p className="text-destructive">Error al cargar proveedores: {error.message}</p>
      ) : (
        <SupplierTable initialData={suppliers || []} />
      )}
    </div>
  );
}
