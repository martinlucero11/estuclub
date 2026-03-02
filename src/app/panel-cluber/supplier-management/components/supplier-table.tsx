'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getSupplierColumns } from './columns'; 
import { DataTable } from '@/components/ui/data-table';
import { SupplierProfile } from '@/types/data';
import { toast } from 'sonner';
import { createConverter } from '@/lib/firestore-converter';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';
import { SupplierEditDialog } from './supplier-edit-dialog';
import { UserForList } from './user-management-columns';

export function SupplierTable() {
  const firestore = useFirestore();
  const [loadingStates, setLoadingStates] = useState<Record<string, Record<string, boolean>>>({});
  const [supplierIdToDelete, setSupplierIdToDelete] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierProfile | null>(null);

  const suppliersQuery = useMemo(
    () => query(collection(firestore, "roles_supplier").withConverter(createConverter<SupplierProfile>()), orderBy("name")),
    [firestore]
  );
  const { data: suppliers, isLoading, error } = useCollection(suppliersQuery);

  const handleToggle = async (
    supplierId: string,
    capability: keyof SupplierProfile,
    isEnabled: boolean
  ) => {
    setLoadingStates(prev => ({ ...prev, [supplierId]: { ...(prev[supplierId] || {}), [capability]: true } }));

    try {
      const supplierRef = doc(firestore, 'roles_supplier', supplierId);
      await updateDoc(supplierRef, { [capability]: isEnabled });
      
      toast.success(`Proveedor actualizado: ${capability.toString()} ${isEnabled ? 'habilitado' : 'deshabilitado'}.`);

    } catch (error) {
      console.error("Error updating supplier capability:", error);
      toast.error('Error al actualizar el proveedor.');
    }
    finally {
      setLoadingStates(prev => ({ ...prev, [supplierId]: { ...(prev[supplierId] || {}), [capability]: false } }));
    }
  };

  const handleDeleteRequest = (supplierId: string) => {
    setSupplierIdToDelete(supplierId);
  };
  
  const handleDeleteConfirm = async () => {
    if (!supplierIdToDelete) return;
    try {
      await deleteDoc(doc(firestore, 'roles_supplier', supplierIdToDelete));
      toast.success('Proveedor eliminado correctamente.');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('No se pudo eliminar el proveedor.');
    } finally {
      setSupplierIdToDelete(null);
    }
  };
  
  const handleEdit = (supplier: SupplierProfile) => {
    setSelectedSupplier(supplier);
    setIsEditDialogOpen(true);
  };

  const columns = useMemo(() => getSupplierColumns({ onToggle: handleToggle, onDelete: handleDeleteRequest, onEdit: handleEdit, loadingStates }), [loadingStates]);

  const userForDialog: UserForList | undefined = selectedSupplier ? {
    id: selectedSupplier.id,
    uid: selectedSupplier.id,
    email: selectedSupplier.email,
    firstName: selectedSupplier.name.split(' ')[0],
    lastName: selectedSupplier.name.split(' ').slice(1).join(' '),
    username: selectedSupplier.slug,
    dni: ''
  } : undefined;

  return (
    <>
      <DataTable
        columns={columns}
        data={suppliers || []}
        isLoading={isLoading}
        filterColumn="name"
        filterPlaceholder="Filtrar por nombre de proveedor..."
      />
       <DeleteConfirmationDialog
          isOpen={!!supplierIdToDelete}
          onOpenChange={(open) => !open && setSupplierIdToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="¿Eliminar este proveedor?"
          description="Esta acción es permanente y no se puede deshacer. Se eliminará el rol de proveedor, pero no la cuenta de usuario."
      />
      {isEditDialogOpen && selectedSupplier && userForDialog && (
        <SupplierEditDialog 
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          user={userForDialog}
          supplierProfile={selectedSupplier}
        />
      )}
    </>
  );
}
