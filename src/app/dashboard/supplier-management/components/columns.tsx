
'use client';

import { ColumnDef } from "@tanstack/react-table";
import { SupplierProfile } from "@/types/data";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal, Trash2, Edit, ImageIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { AdminSupplierImageModal } from "@/components/admin/admin-supplier-image-modal";

type ToggleHandler = (
  supplierId: string, 
  capability: keyof SupplierProfile, 
  isEnabled: boolean
) => void;

type DeleteHandler = (supplierId: string) => void;
type EditHandler = (supplier: SupplierProfile) => void;

type LoadingStates = Record<string, Record<string, boolean>>;

interface ColumnsProps {
  onToggle: ToggleHandler;
  onDelete: DeleteHandler;
  onEdit: EditHandler;
  loadingStates: LoadingStates;
}

export const getSupplierColumns = ({ onToggle, onDelete, onEdit, loadingStates }: ColumnsProps): ColumnDef<SupplierProfile>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Proveedor
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
    ),
  },
  {
    id: "isVisible",
    header: () => <div className="text-center">Visible</div>,
    cell: ({ row }) => {
      const supplier = row.original;
      const isLoading = loadingStates[supplier.id]?.isVisible;

      return (
        <div className="flex justify-center">
          <Switch
            checked={!!supplier.isVisible}
            onCheckedChange={(value) => onToggle(supplier.id, 'isVisible', value)}
            disabled={isLoading}
            aria-label="Toggle visibilidad"
          />
        </div>
      );
    },
  },
  {
    id: "appointmentsEnabled",
    header: () => <div className="text-center">Turnos</div>,
    cell: ({ row }) => {
      const supplier = row.original;
      const isLoading = loadingStates[supplier.id]?.appointmentsEnabled;

      return (
        <div className="flex justify-center">
          <Switch
            checked={!!supplier.appointmentsEnabled}
            onCheckedChange={(value) => onToggle(supplier.id, 'appointmentsEnabled', value)}
            disabled={isLoading}
            aria-label="Toggle turnos"
          />
        </div>
      );
    },
  },
  {
    id: "canCreatebenefits",
    header: () => <div className="text-center">Beneficios</div>,
    cell: ({ row }) => {
      const supplier = row.original;
      const isLoading = loadingStates[supplier.id]?.canCreatebenefits;

      return (
        <div className="flex justify-center">
          <Switch
            checked={!!supplier.canCreatebenefits}
            onCheckedChange={(value) => onToggle(supplier.id, 'canCreatebenefits', value)}
            disabled={isLoading}
            aria-label="Toggle beneficios"
          />
        </div>
      );
    },
  },
  {
    id: "announcementsEnabled",
    header: () => <div className="text-center">Anuncios</div>,
    cell: ({ row }) => {
      const supplier = row.original;
      const isLoading = loadingStates[supplier.id]?.announcementsEnabled;

      return (
        <div className="flex justify-center">
          <Switch
            checked={!!supplier.announcementsEnabled}
            onCheckedChange={(value) => onToggle(supplier.id, 'announcementsEnabled', value)}
            disabled={isLoading}
            aria-label="Toggle anuncios"
          />
        </div>
      );
    },
  },
  {
    id: "canSendNotifications",
    header: () => <div className="text-center">Notificaciones</div>,
    cell: ({ row }) => {
      const supplier = row.original;
      const isLoading = loadingStates[supplier.id]?.canSendNotifications;

      return (
        <div className="flex justify-center">
          <Switch
            checked={!!supplier.canSendNotifications}
            onCheckedChange={(value) => onToggle(supplier.id, 'canSendNotifications', value)}
            disabled={isLoading}
            aria-label="Toggle notificaciones"
          />
        </div>
      );
    },
  },
  {
    id: "isFeatured",
    header: () => <div className="text-center">Destacado</div>,
    cell: ({ row }) => {
      const supplier = row.original;
      const isLoading = loadingStates[supplier.id]?.isFeatured;

      return (
        <div className="flex justify-center">
          <Switch
            checked={!!supplier.isFeatured}
            onCheckedChange={(value) => onToggle(supplier.id, 'isFeatured', value)}
            disabled={isLoading}
            aria-label="Toggle destacado"
          />
        </div>
      );
    },
  },
  {
    id: "deliveryEnabled",
    header: () => <div className="text-center">Delivery</div>,
    cell: ({ row }) => {
      const supplier = row.original;
      const isLoading = loadingStates[supplier.id]?.deliveryEnabled;

      return (
        <div className="flex justify-center">
          <Switch
            checked={!!supplier.deliveryEnabled}
            onCheckedChange={(value) => onToggle(supplier.id, 'deliveryEnabled', value)}
            disabled={isLoading}
            aria-label="Toggle delivery"
          />
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Estado",
    cell: ({ row }) => {
        const isActive = row.original.isVisible;
        return <Badge variant={isActive ? 'default' : 'outline'}>{isActive ? "Activo" : "Oculto"}</Badge>;
    },
  },
   {
    id: "actions",
    cell: ({ row }) => {
      const supplier = row.original;
      return (
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menú</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(supplier)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Perfil
                </DropdownMenuItem>
                <AdminSupplierImageModal supplier={supplier}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Editar Imágenes
                    </DropdownMenuItem>
                </AdminSupplierImageModal>
                <DropdownMenuItem onClick={() => onDelete(supplier.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
