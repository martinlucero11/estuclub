'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { User } from '@/firebase/auth/current-user';
import type { BenefitRedemption } from '@/types/data';
import { DataTable } from '@/components/ui/data-table';
import { columns as baseColumns } from './redemption-columns';
import { makeBenefitRedemptionSerializable } from '@/lib/data';
import { createConverter } from '@/lib/firestore-converter';

interface RedemptionListProps {
  user: User;
}

export default function RedemptionList({ user }: RedemptionListProps) {
  const firestore = useFirestore();
  const isAdmin = user.roles.includes('admin');

  const redemptionsQuery = useMemo(() => {
    if (!firestore) return null;
    const baseQuery = query(collection(firestore, 'benefitRedemptions').withConverter(createConverter<BenefitRedemption>()), orderBy('redeemedAt', 'desc'));
    if (isAdmin) {
      return baseQuery;
    } else {
      // For suppliers, filter by their own ID
      return query(baseQuery, where('supplierId', '==', user.uid));
    }
  }, [firestore, isAdmin, user.uid]);

  const { data: redemptions, isLoading, error } = useCollection(redemptionsQuery);

  // Dynamically add columns based on user role
  const columns = useMemo(() => {
    const newColumns = [...baseColumns];

    // Both Admins and Suppliers should see who redeemed the benefit.
    newColumns.splice(1, 0, { accessorKey: 'userName', header: 'Estudiante' });

    // Only Admins need to see the "Supplier" column, as suppliers are already
    // viewing their own redemptions.
    if (isAdmin) {
      newColumns.splice(1, 0, { accessorKey: 'supplierName', header: 'Proveedor' });
    }
    
    return newColumns;
  }, [isAdmin]);


  if (error) {
    return <p className="text-red-500">Error: {error.message}</p>;
  }

  // We need to enrich the data with supplierName and userName for the admin view
  const processedData = useMemo(() => {
    if (!redemptions) return [];
    return redemptions.map(r => makeBenefitRedemptionSerializable(r));
  }, [redemptions]);

  return (
    <DataTable
      columns={columns}
      data={processedData}
      isLoading={isLoading}
      filterColumn='benefitTitle'
      filterPlaceholder='Filtrar por beneficio...'
    />
  );
}
