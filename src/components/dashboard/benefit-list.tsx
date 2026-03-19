'use client';

import { useMemo, useState, useCallback } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import type { Benefit, SerializableBenefit, UserRole } from '@/types/data';
import { makeBenefitSerializable } from '@/lib/data';
import { DataTable } from '@/components/ui/data-table';
import { getBenefitColumns } from './benefit-columns';
import { useToast } from '@/hooks/use-toast';
import EditBenefitDialog from '@/components/perks/edit-perk-dialog';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';
import { createConverter } from '@/lib/firestore-converter';

interface User {
  uid: string;
  email: string | null;
  roles: UserRole[];
}

interface BenefitListProps {
  user: User;
}

export default function BenefitList({ user }: BenefitListProps) {
  const firestore = useFirestore();
  const isAdmin = user.roles.includes('admin');
  const { toast } = useToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<SerializableBenefit | null>(null);
  const [benefitIdToDelete, setBenefitIdToDelete] = useState<string | null>(null);

  const benefitsQuery = useMemo(() => {
    if (!firestore) return null;
    let q = query(collection(firestore, 'benefits').withConverter(createConverter<Benefit>()));
    if (!isAdmin) {
      q = query(q, where('ownerId', '==', user.uid));
    }
    return q;
  }, [firestore, isAdmin, user.uid]);

  const { data: benefits, isLoading, error } = useCollection(benefitsQuery);

  const sortedBenefits = useMemo(() => {
    if (!benefits) return [];
    return [...benefits].sort((a, b) => {
      const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
      const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
      return dateB - dateA;
    });
  }, [benefits]);

  const serializableBenefits: SerializableBenefit[] = useMemo(() => {
    if (!sortedBenefits) return [];
    return sortedBenefits.map(makeBenefitSerializable);
  }, [sortedBenefits]);

  const handleEdit = useCallback((benefit: SerializableBenefit) => {
    setSelectedBenefit(benefit);
    setIsEditDialogOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((benefitId: string) => {
    setBenefitIdToDelete(benefitId);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!benefitIdToDelete) return;
    const benefitRef = doc(firestore, 'benefits', benefitIdToDelete);
    try {
      await deleteDoc(benefitRef);
      toast({ title: 'Beneficio eliminado', description: 'El beneficio ha sido eliminado con éxito.' });
    } catch (error) {
      console.error('Error deleting benefit:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el beneficio.' });
    } finally {
      setIsDeleteDialogOpen(false);
      setBenefitIdToDelete(null);
    }
  }, [benefitIdToDelete, firestore, toast]);

  // Memoize columns with the handlers
  const columns = useMemo(() => {
    return getBenefitColumns(handleEdit, handleDeleteRequest, isAdmin);
  }, [isAdmin, handleEdit, handleDeleteRequest]);


  if (error) {
    return <p className="text-red-500">Error: {error.message}</p>;
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={serializableBenefits}
        isLoading={isLoading}
        filterColumn='title'
        filterPlaceholder='Filtrar por título...'
      />
      {selectedBenefit && (
        <EditBenefitDialog
          isOpen={isEditDialogOpen}
          onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) setSelectedBenefit(null);
          }}
          benefit={selectedBenefit}
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
