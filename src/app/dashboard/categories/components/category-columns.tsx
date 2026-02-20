'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Category } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal, Square } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getIcon } from '@/components/icons';

// Define the shape of the actions props
interface CategoryActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

// Actions component for the dropdown
const CategoryActions: React.FC<CategoryActionsProps> = ({ onEdit, onDelete }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Abrir menú</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
      <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
      <DropdownMenuItem onClick={onDelete} className="text-destructive">
        Eliminar
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

// This type is used to define the shape of our data.
export const getCategoryColumns = (
    onEdit: (category: Category) => void,
    onDelete: (categoryId: string) => void
): ColumnDef<Category>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'iconName',
    header: 'Icono',
    cell: ({ row }) => {
        const iconName = row.getValue('iconName') as string;
        const colorClass = row.original.colorClass as string;
        const Icon = getIcon(iconName);
        return <Icon className={`h-6 w-6 ${colorClass}`} />;
    },
  },
    {
    accessorKey: 'colorClass',
    header: 'Color',
    cell: ({ row }) => {
        const colorClass = row.getValue('colorClass') as string;
        return (
            <div className="flex items-center gap-2">
                <Square className={`h-5 w-5 ${colorClass}`} />
                <span className="text-muted-foreground text-xs">{colorClass}</span>
            </div>
        );
    }
    },
  {
    id: 'actions',
    cell: ({ row }) => {
      const category = row.original;
      return (
        <CategoryActions 
            onEdit={() => onEdit(category)}
            onDelete={() => onDelete(category.id)}
        />
      );
    },
  },
];
