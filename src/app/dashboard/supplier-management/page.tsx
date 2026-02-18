
// Remove client-side imports
import { firestore } from "@/firebase/server-config"; // Keep admin import
import { SupplierProfile } from "@/types/data";
import { SupplierTable } from "./components/supplier-table";

/**
 * Server component to fetch all supplier profiles from Firestore using the Admin SDK.
 */
async function getSuppliers(): Promise<SupplierProfile[]> {
  // Use the Admin SDK syntax to get the collection and documents
  const snapshot = await firestore.collection("roles_supplier").get();
  
  if (snapshot.empty) {
    return [];
  }

  // The rest of the mapping logic is compatible
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SupplierProfile[];
}

/**
 * Main page for the Supplier Management dashboard (Admin only).
 */
export default async function SupplierManagementPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Gestión de Proveedores</h1>
      <p className="text-muted-foreground mb-8">
        Activa o desactiva módulos de funcionalidades para cada proveedor.
      </p>
      <SupplierTable initialData={suppliers} />
    </div>
  );
}
