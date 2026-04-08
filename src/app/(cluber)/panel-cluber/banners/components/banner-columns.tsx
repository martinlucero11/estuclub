
'use client';

import Image from 'next/image';
import { ColumnDef } from '@tanstack/react-table';
import type { SerializableAnnouncement } from '@/types/data';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Link as LinkIcon, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Define the shape of the actions props
interface AnnouncementActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

// Actions component for the dropdown
const AnnouncementActions: React.FC<AnnouncementActionsProps> = ({ onEdit, onDelete }) => (
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
export const getAnnouncementColumns = (
    onToggleActive: (bannerId: string, isActive: boolean) => void,
    onEdit: (banner: SerializableAnnouncement) => void,
    onDelete: (bannerId: string) => void
): ColumnDef<SerializableAnnouncement>[] => [
  {
    accessorKey: 'imageUrl',
    header: 'Imagen',
    cell: ({ row }) => {
      const imageUrl = row.getValue('imageUrl') as string;
      const title = row.original.title;
      return <Image src={imageUrl} alt={title} width={100} height={50} className="rounded-md object-cover" />;
    },
  },
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
      );
    },
  },
  {
    accessorKey: 'link',
    header: 'Enlace',
    cell: ({ row }) => {
        const link = row.getValue('link') as string | undefined;
        return link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <LinkIcon className="h-3 w-3" />
                Visitar
            </a>
        ) : <span className='text-foreground'>N/A</span>;
    }
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
          aria-label="Toggle banner active state"
        />
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const banner = row.original;
      return (
        <AnnouncementActions 
            onEdit={() => onEdit(banner)}
            onDelete={() => onDelete(banner.id)}
        />
      );
    },
  },
];

