
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
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

// Actions component for the dropdown
const SectionActions: React.FC<SectionActionsProps> = ({ onEdit, onDelete, onMoveUp, onMoveDown }) => (
  <div className="flex items-center gap-1">
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 hover:bg-primary/10 hover:text-primary" 
      onClick={onMoveUp}
      title="Mover arriba"
    >
      <ArrowUpDown className="h-4 w-4 rotate-180" />
    </Button>
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 hover:bg-primary/10 hover:text-primary" 
      onClick={onMoveDown}
      title="Mover abajo"
    >
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
        <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);


export const getHomeSectionColumns = (
    onToggleActive: (sectionId: string, isActive: boolean) => void,
    onEdit: (section: HomeSection) => void,
    onDelete: (sectionId: string) => void,
    onMoveUp: (section: HomeSection) => void,
    onMoveDown: (section: HomeSection) => void
): ColumnDef<HomeSection>[] => [
  {
    id: 'drag-handle',
    header: '',
    cell: () => <GripVertical className="h-4 w-4 text-foreground cursor-grab" />,
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
        let description: string = block.kind;
        if ('contentType' in block && block.contentType) {
            const typeLabels: Record<string, string> = {
                perks: 'Beneficios',
                suppliers: 'Clubers',
                delivery_suppliers: 'Delivery',
                professionals: 'Profesionales',
                services: 'Servicios',
                products: 'Productos',
                announcements: 'Anuncios',
                banners: 'Announcements',
                benefits_nearby: 'Beneficios GPS',
                suppliers_nearby: 'Clubers GPS'
            };
            description = `${block.kind} · ${typeLabels[block.contentType] || block.contentType}`;
        }
        return <Badge variant="secondary" className="capitalize font-bold">{description}</Badge>;
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
            onMoveUp={() => onMoveUp(section)}
            onMoveDown={() => onMoveDown(section)}
        />
      );
    },
  },
];

