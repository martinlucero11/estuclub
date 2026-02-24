
'use client';

import { useMemo, useState } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, doc, deleteDoc } from 'firebase/firestore';
import type { User } from '@/firebase/auth/current-user';
import type { Perk, SerializablePerk } from '@/lib/data';
import { makePerkSerializable } from '@/lib/data';
import { DataTable } from '@/components/ui/data-table';
import { getBenefitColumns } from './benefit-columns';
import { useToast } from '@/hooks/use-toast';
import EditPerkDialog from '@/components/perks/edit-perk-dialog';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';
import { createConverter } from '@/lib/firestore-converter';

interface BenefitListProps {
  user: User;
}

export default function BenefitList({ user }: BenefitListProps) {
  const firestore = useFirestore();
  const isAdmin = user.roles.includes('admin');
  const { toast } = useToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPerk, setSelectedPerk] = useState<SerializablePerk | null>(null);
  const [perkIdToDelete, setPerkIdToDelete] = useState<string | null>(null);

  const benefitsQuery = useMemo(() => {
    if (!firestore) return null;
    let q = query(collection(firestore, 'benefits').withConverter(createConverter<Perk>()), orderBy('createdAt', 'desc'));
    // If user is not admin, they must be a supplier, so filter by their ID
    if (!isAdmin) {
      q = query(q, where('ownerId', '==', user.uid));
    }
    return q;
  }, [firestore, isAdmin, user.uid]);

  const { data: benefits, isLoading, error } = useCollection(benefitsQuery);
  
  const serializablePerks: SerializablePerk[] = useMemo(() => {
    if (!benefits) return [];
    return benefits.map(makePerkSerializable);
  }, [benefits]);

  const handleEdit = (perk: SerializablePerk) => {
    setSelectedPerk(perk);
    setIsEditDialogOpen(true);
  };

  const handleDeleteRequest = (perkId: string) => {
    setPerkIdToDelete(perkId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!perkIdToDelete) return;
    const perkRef = doc(firestore, 'benefits', perkIdToDelete);
    try {
      await deleteDoc(perkRef);
      toast({ title: 'Beneficio eliminado', description: 'El beneficio ha sido eliminado con éxito.' });
    } catch (error) {
      console.error('Error deleting perk:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el beneficio.' });
    } finally {
      setIsDeleteDialogOpen(false);
      setPerkIdToDelete(null);
    }
  };

  // Memoize columns with the handlers
  const columns = useMemo(() => {
    const baseColumns = getBenefitColumns(handleEdit, handleDeleteRequest);
    const supplierColumn = {
      accessorKey: 'supplierName',
      header: 'Proveedor',
    };
    if (isAdmin) {
      const titleIndex = baseColumns.findIndex((c: any) => c.accessorKey === 'title');
      const newColumns = [...baseColumns];
      if (titleIndex !== -1) {
          newColumns.splice(titleIndex + 1, 0, supplierColumn);
      } else {
          newColumns.unshift(supplierColumn)
      }
      return newColumns;
    }
    return baseColumns;
  }, [isAdmin]);


  if (error) {
    return <p className="text-red-500">Error: {error.message}</p>;
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={serializablePerks}
        isLoading={isLoading}
        filterColumn='title'
        filterPlaceholder='Filtrar por título...'
      />
      {selectedPerk && (
        <EditPerkDialog
          isOpen={isEditDialogOpen}
          onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) setSelectedPerk(null);
          }}
          perk={selectedPerk}
        />
      )}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar este beneficio?"
        description="Esta acción es permanente y no se puede deshacer."
      />
    </>
  );
}
