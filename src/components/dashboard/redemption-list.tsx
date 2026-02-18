
'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { User } from '@/firebase/auth/current-user';
import type { BenefitRedemption } from '@/lib/data';
import { DataTable } from '@/components/ui/data-table';
import { columns as baseColumns } from './redemption-columns';

interface RedemptionListProps {
  user: User;
}

export default function RedemptionList({ user }: RedemptionListProps) {
  const firestore = useFirestore();
  const isAdmin = user.roles.includes('admin');

  const redemptionsQuery = useMemo(() => {
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
    // This is a placeholder. In a real app, you'd fetch supplier/user names based on IDs.
    return redemptions.map(r => ({
      ...r,
      supplierName: r.supplierName || r.supplierId,
      userName: r.userName || r.userId,
    }));
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
