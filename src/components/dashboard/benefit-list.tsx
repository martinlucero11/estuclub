
'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { User } from '@/firebase/auth/current-user';
import type { Perk } from '@/lib/data';
import { DataTable } from '@/components/ui/data-table';
import { columns as baseColumns } from './benefit-columns';

interface BenefitListProps {
  user: User;
}

export default function BenefitList({ user }: BenefitListProps) {
  const firestore = useFirestore();
  const isAdmin = user.roles.includes('admin');

  const benefitsQuery = useMemo(() => {
    const baseQuery = query(collection(firestore, 'benefits'), orderBy('createdAt', 'desc'));
    if (isAdmin) {
      return baseQuery;
    } else {
      // For suppliers, filter by their own ID
      return query(baseQuery, where('supplierId', '==', user.uid));
    }
  }, [firestore, isAdmin, user.uid]);

  const { data: benefits, isLoading, error } = useCollection<Perk>(benefitsQuery);

  // Dynamically add the 'supplier' column for admins
  const columns = useMemo(() => {
    const supplierColumn = {
      accessorKey: 'supplierName',
      header: 'Proveedor',
    };
    if (isAdmin) {
      // Insert supplier column after the title column
      const titleIndex = baseColumns.findIndex(c => c.accessorKey === 'title');
      const newColumns = [...baseColumns];
      newColumns.splice(titleIndex + 1, 0, supplierColumn);
      return newColumns;
    }
    return baseColumns;
  }, [isAdmin]);

  if (error) {
    return <p className="text-red-500">Error: {error.message}</p>;
  }

  return (
    <DataTable
      columns={columns}
      data={benefits || []}
      isLoading={isLoading}
      filterColumn='title'
      filterPlaceholder='Filtrar por título...'
    />
  );
}
