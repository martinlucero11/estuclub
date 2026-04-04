
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { Announcement } from '@/types/data';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AnnouncementActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

const AnnouncementActions: React.FC<AnnouncementActionsProps> = ({ onEdit, onDelete, onApprove, onReject }) => (
  <div className="flex items-center gap-1">
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
            Ver / Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
        </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
    {onApprove && (
        <Button variant="ghost" size="icon" onClick={onApprove} className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10">
            <CheckCircle2 className="h-4 w-4" />
        </Button>
    )}
    {onReject && (
        <Button variant="ghost" size="icon" onClick={onReject} className="h-8 w-8 text-red-500 hover:bg-red-500/10">
            <XCircle className="h-4 w-4" />
        </Button>
    )}
  </div>
);

export const getAnnouncementColumns = (
    onToggleVisibility: (announcementId: string, isVisible: boolean) => void,
    onEdit: (announcement: Announcement) => void,
    onDelete: (announcementId: string) => void,
    onApprove: (announcementId: string) => void,
    onReject: (announcementId: string) => void
): ColumnDef<Announcement>[] => [
  {
    accessorKey: 'title',
    header: 'Anuncio',
    cell: ({ row }) => (
        <div className="flex flex-col">
            <span className="font-bold truncate max-w-[200px]">{row.original.title}</span>
            <span className="text-[10px] opacity-40 uppercase tracking-widest font-black italic">#{row.original.authorUsername}</span>
        </div>
    )
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
        const status = row.original.status;
        const variants = {
            approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
            rejected: "bg-red-500/10 text-red-400 border-red-500/20"
        };
        const icons = {
            approved: <CheckCircle2 className="h-3 w-3 mr-1" />,
            pending: <Clock className="h-3 w-3 mr-1" />,
            rejected: <XCircle className="h-3 w-3 mr-1" />
        };
        return (
            <Badge variant="outline" className={cn("capitalize rounded-lg", variants[status])}>
                {icons[status]}
                {status}
            </Badge>
        );
    }
  },
  {
    accessorKey: 'targeting',
    header: 'Target',
    cell: ({ row }) => {
        const { isStudentOnly, isCincoDosOnly, minLevel } = row.original;
        return (
            <div className="flex flex-wrap gap-1">
                {isStudentOnly && <Badge variant="secondary" className="text-[8px] h-4 bg-blue-500/10 text-blue-400 px-1 border-blue-500/20 font-black">ESTU</Badge>}
                {isCincoDosOnly && <Badge variant="secondary" className="text-[8px] h-4 bg-emerald-500/10 text-emerald-400 px-1 border-emerald-500/20 font-black italic">5.2</Badge>}
                <Badge variant="outline" className="text-[8px] h-4 bg-white/5 font-mono px-1">Lv.{minLevel || 1}</Badge>
            </div>
        );
    }
  },
  {
    accessorKey: 'isVisible',
    header: 'Visible',
    cell: ({ row }) => {
      const announcement = row.original;
      return (
        <Switch
          checked={announcement.isVisible}
          onCheckedChange={(value) => onToggleVisibility(announcement.id, value)}
          className="data-[state=checked]:bg-primary"
        />
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const announcement = row.original;
      return (
        <AnnouncementActions 
            onEdit={() => onEdit(announcement)}
            onDelete={() => onDelete(announcement.id)}
            onApprove={announcement.status === 'pending' ? () => onApprove(announcement.id) : undefined}
            onReject={announcement.status === 'pending' ? () => onReject(announcement.id) : undefined}
        />
      );
    },
  },
];
