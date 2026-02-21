'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { SerializableBenefitRedemption } from '@/lib/data'; // Import the serializable type
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

// Use the serializable type for the column definitions
export const columns: ColumnDef<SerializableBenefitRedemption>[] = [
  {
    accessorKey: 'benefitTitle',
    header: 'Beneficio',
  },
  {
    accessorKey: 'redeemedAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Fecha de Canje
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      // The value is now a string, so we create a Date object from it
      const date = new Date(row.getValue('redeemedAt'));
      return format(date, 'dd/MM/yyyy HH:mm');
    }
  },
  // Admin-only columns for userName and supplierName are added dynamically in the main component
];
