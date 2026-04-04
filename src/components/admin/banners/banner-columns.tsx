
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { Banner } from '@/types/data';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface BannerActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

const BannerActions: React.FC<BannerActionsProps> = ({ onEdit, onDelete }) => (
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
);

export const getBannerColumns = (
    onToggleActive: (bannerId: string, isActive: boolean) => void,
    onEdit: (banner: Banner) => void,
    onDelete: (bannerId: string) => void
): ColumnDef<Banner>[] => [
  {
    accessorKey: 'imageUrl',
    header: 'Imagen',
    cell: ({ row }) => {
        const imageUrl = row.original.imageUrl;
        return (
            <div className="relative h-12 w-24 rounded-lg overflow-hidden border bg-muted">
                <Image 
                    src={imageUrl} 
                    alt={row.original.title || 'Banner'} 
                    fill 
                    className="object-cover"
                />
            </div>
        );
    }
  },
  {
    accessorKey: 'title',
    header: 'Título',
    cell: ({ row }) => (
        <div className="font-medium max-w-[200px] truncate">{row.original.title}</div>
    )
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ row }) => (
        <div className="text-xs text-muted-foreground max-w-[300px] truncate">
            {row.original.description}
        </div>
    )
  },
  {
    accessorKey: 'isActive',
    header: 'Activo',
    cell: ({ row }) => {
      const banner = row.original;
      return (
        <Switch
          checked={banner.isActive}
          onCheckedChange={(value) => onToggleActive(banner.id, value)}
        />
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const banner = row.original;
      return (
        <BannerActions 
            onEdit={() => onEdit(banner)}
            onDelete={() => onDelete(banner.id)}
        />
      );
    },
  },
];
