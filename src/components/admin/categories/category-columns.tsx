
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { Category } from '@/types/data';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface CategoryActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const CategoryActions: React.FC<CategoryActionsProps> = ({ onEdit, onDelete, onMoveUp, onMoveDown }) => (
  <div className="flex items-center gap-1">
    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={onMoveUp} title="Mover arriba">
      <ArrowUpDown className="h-4 w-4 rotate-180" />
    </Button>
    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={onMoveDown} title="Mover abajo">
      <ArrowUpDown className="h-4 w-4" />
    </Button>
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
        </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
        </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

export const getCategoryColumns = (
    onToggleActive: (categoryId: string, isActive: boolean) => void,
    onEdit: (category: Category) => void,
    onDelete: (categoryId: string) => void,
    onMoveUp: (category: Category) => void,
    onMoveDown: (category: Category) => void
): ColumnDef<Category>[] => [
  {
    accessorKey: 'icon',
    header: 'Icono',
    cell: ({ row }) => (
        <div className="text-2xl h-10 w-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/5">
            {row.original.icon}
        </div>
    )
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
    cell: ({ row }) => <div className="font-bold">{row.original.name}</div>
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => {
        const type = row.original.type;
        const variants: Record<string, string> = {
            delivery: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            benefits: "bg-primary/10 text-primary border-primary/20",
            discount: "bg-primary/10 text-primary border-primary/20",
            turns: "bg-orange-500/10 text-orange-400 border-orange-500/20",
            global: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        };
        return <Badge variant="outline" className={variants[type] || ""}>{type}</Badge>;
    }
  },
  {
    accessorKey: 'order',
    header: 'Orden',
    cell: ({ row }) => <div className="font-mono text-xs">{row.original.order}</div>
  },
  {
    accessorKey: 'isActive',
    header: 'Activo',
    cell: ({ row }) => {
      const category = row.original;
      return (
        <Switch
          checked={category.isActive}
          onCheckedChange={(value) => onToggleActive(category.id, value)}
        />
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const category = row.original;
      return (
        <CategoryActions 
            onEdit={() => onEdit(category)}
            onDelete={() => onDelete(category.id)}
            onMoveUp={() => onMoveUp(category)}
            onMoveDown={() => onMoveDown(category)}
        />
      );
    },
  },
];
