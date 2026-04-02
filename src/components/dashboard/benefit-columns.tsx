
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { SerializableBenefit } from '@/types/data';
import { ArrowUpDown, Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '../ui/badge';

export const getBenefitColumns = (
  onEdit: (benefit: SerializableBenefit) => void,
  onDelete: (benefitId: string) => void,
  isAdmin: boolean,
): ColumnDef<SerializableBenefit>[] => {
  
  const columns: ColumnDef<SerializableBenefit>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Título <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Categoría',
    },
    {
      accessorKey: 'redemptionCount',
      header: 'Canjes',
    },
    {
      accessorKey: 'isFeatured',
      header: 'Destacado',
      cell: ({ row }) => {
        const isFeatured = row.getValue('isFeatured');
        return isFeatured ? <Badge>Sí</Badge> : <Badge variant="outline">No</Badge>;
      }
    },
     {
      accessorKey: 'isVisible',
      header: 'Visible',
      cell: ({ row }) => {
        const isVisible = row.getValue('isVisible');
        return isVisible ? <Badge className="bg-emerald-500 hover:bg-emerald-600">Sí</Badge> : <Badge variant="outline">No</Badge>;
      }
    },
    {
        accessorKey: 'targetAudience',
        header: 'Público',
        cell: ({ row }) => {
            const audience = row.getValue('targetAudience') as string;
            if (audience === 'cinco_dos') {
                return (
                    <Badge className="bg-primary hover:bg-primary/90 gap-1 uppercase text-[10px] py-1 px-3">
                        Social
                    </Badge>
                );
            }
            return <Badge variant="secondary" className="uppercase text-[9px] opacity-60">General</Badge>;
        }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const benefit = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(benefit)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(benefit.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isAdmin) {
    columns.splice(1, 0, {
      accessorKey: 'supplierName',
      header: 'Proveedor',
    });
  }

  return columns;
}

