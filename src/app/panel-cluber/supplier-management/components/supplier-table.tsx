
'use client';

import React, { useState, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { columns } from './columns'; 
import { DataTable } from '@/components/ui/data-table';
import { SupplierProfile } from '@/types/data';
import { toast } from 'sonner';

interface SupplierTableProps {
  initialData: SupplierProfile[];
}

export function SupplierTable({ initialData }: SupplierTableProps) {
  const firestore = useFirestore();
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>(initialData);
  const [loadingStates, setLoadingStates] = useState<Record<string, Record<string, boolean>>>({});

  const handleToggleCapability = async (
    supplierId: string,
    capability: keyof SupplierProfile,
    isEnabled: boolean
  ) => {
    // Optimistic UI update
    setSuppliers(current =>
      current.map(s =>
        s.id === supplierId ? { ...s, [capability]: isEnabled } : s
      )
    );
    
    setLoadingStates(prev => ({ ...prev, [supplierId]: { ...(prev[supplierId] || {}), [capability]: true } }));

    try {
      const supplierRef = doc(firestore, 'roles_supplier', supplierId);
      await updateDoc(supplierRef, { [capability]: isEnabled });
      
      toast.success(`Proveedor actualizado: la funcionalidad se ha ${isEnabled ? 'habilitado' : 'deshabilitado'}.`);

    } catch (error) {
      console.error("Error updating supplier capability:", error);
      toast.error('Error al actualizar el proveedor. Revirtiendo cambios.');
      // Revert optimistic update on error
      setSuppliers(initialData);
    }
    finally {
      setLoadingStates(prev => ({ ...prev, [supplierId]: { ...(prev[supplierId] || {}), [capability]: false } }));
    }
  };

  const memoizedColumns = useMemo(() => columns({ onToggle: handleToggleCapability, loadingStates }), [loadingStates]);

  return (
    <DataTable
      columns={memoizedColumns}
      data={suppliers}
      filterColumn="name"
      filterPlaceholder="Filtrar por nombre de proveedor..."
    />
  );
}
