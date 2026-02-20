'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { SupplierProfile } from "@/types/data";
import { SupplierTable } from "./components/supplier-table";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Main page for the Supplier Management dashboard (Admin only).
 * This has been converted to a client component to avoid server-side auth issues
 * with the Firebase Admin SDK in the App Hosting environment.
 */
export default function SupplierManagementPage() {
  const firestore = useFirestore();

  const suppliersQuery = useMemoFirebase(
    () => query(collection(firestore, "roles_supplier"), orderBy("name")),
    [firestore]
  );

  const { data: suppliers, isLoading, error } = useCollection<SupplierProfile>(suppliersQuery);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Gestión de Proveedores</h1>
      <p className="text-muted-foreground mb-8">
        Activa o desactiva módulos de funcionalidades para cada proveedor.
      </p>
      
      {isLoading ? (
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
