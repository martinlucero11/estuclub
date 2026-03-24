
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { HomeSection } from '@/types/data';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal, Layers, GripVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

// Define the shape of the actions props
interface SectionActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

// Actions component for the dropdown
const SectionActions: React.FC<SectionActionsProps> = ({ onEdit, onDelete }) => (
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


export const getHomeSectionColumns = (
    onToggleActive: (sectionId: string, isActive: boolean) => void,
    onEdit: (section: HomeSection) => void,
    onDelete: (sectionId: string) => void
): ColumnDef<HomeSection>[] => [
  {
    id: 'drag-handle',
    header: '',
    cell: () => <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />,
    size: 20,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Título
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
        <div className="font-medium">{row.original.title}</div>
    )
  },
  {
    accessorKey: 'block',
    header: 'Tipo de Sección',
    cell: ({ row }) => {
        const block = row.original.block;
        const description =
            'contentType' in block && block.contentType
            ? `${block.kind} · ${block.contentType}`
            : block.kind;
        return <Badge variant="secondary" className="capitalize">{description}</Badge>;
    }
  },
   {
    accessorKey: 'order',
    header: ({ column }) => (
        <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
            Orden
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => {
        return <div className="text-center font-mono">{row.original.order}</div>
    }
  },
  {
    accessorKey: 'isActive',
    header: 'Activa',
    cell: ({ row }) => {
      const section = row.original;
      return (
        <Switch
          checked={section.isActive}
          onCheckedChange={(value) => onToggleActive(section.id, value)}
          aria-label="Toggle section active state"
        />
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const section = row.original;
      return (
        <SectionActions 
            onEdit={() => onEdit(section)}
            onDelete={() => onDelete(section.id)}
        />
      );
    },
  },
];
