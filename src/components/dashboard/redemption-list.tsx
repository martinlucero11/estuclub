'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { User } from '@/firebase/auth/current-user';
import type { BenefitRedemption } from '@/lib/data';
import { DataTable } from '@/components/ui/data-table';
import { columns as baseColumns } from './redemption-columns';
import { makeBenefitRedemptionSerializable } from '@/lib/data';

interface RedemptionListProps {
  user: User;
}

export default function RedemptionList({ user }: RedemptionListProps) {
  const firestore = useFirestore();
  const isAdmin = user.roles.includes('admin');

  const redemptionsQuery = useMemo(() => {
    if (!firestore) return null;
    const baseQuery = query(collection(firestore, 'benefitRedemptions'), orderBy('redeemedAt', 'desc'));
    if (isAdmin) {
      return baseQuery;
    } else {
      // For suppliers, filter by their own ID
      return query(baseQuery, where('supplierId', '==', user.uid));
    }
  }, [firestore, isAdmin, user.uid]);

  const { data: redemptions, isLoading, error } = useCollection<BenefitRedemption>(redemptionsQuery);

  // Dynamically add the 'supplierName' and 'userName' columns for admins
  const columns = useMemo(() => {
    if (isAdmin) {
      const newColumns = [...baseColumns];
      // Add supplier name
      newColumns.splice(1, 0, { accessorKey: 'supplierName', header: 'Proveedor' });
      // Add user name
      newColumns.splice(2, 0, { accessorKey: 'userName', header: 'Estudiante' });
      return newColumns;
    }
    return baseColumns;
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
