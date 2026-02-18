
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { BenefitRedemption } from '@/lib/data';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export const columns: ColumnDef<BenefitRedemption>[] = [
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
      const date = row.getValue('redeemedAt') as Date;
      return format(date, 'dd/MM/yyyy HH:mm');
    }
  },
  // Admin-only columns for userName and supplierName are added dynamically in the main component
];
