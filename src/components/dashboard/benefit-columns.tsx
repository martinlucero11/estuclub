
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Perk } from '@/lib/data';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export const columns: ColumnDef<Perk>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Título
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'category',
    header: 'Categoría',
  },
  {
    accessorKey: 'redemptionCount',
    header: 'Canjes',
  },
  // Actions column can be added here if needed
];
