
'use client';

import { ColumnDef } from "@tanstack/react-table";
import { SupplierProfile } from "@/types/data";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

type ToggleHandler = (
  supplierId: string, 
  capability: keyof SupplierProfile, 
  isEnabled: boolean
) => void;

type LoadingStates = Record<string, Record<string, boolean>>;

interface ColumnsProps {
  onToggle: ToggleHandler;
  loadingStates: LoadingStates;
}

export const columns = ({ onToggle, loadingStates }: ColumnsProps): ColumnDef<SupplierProfile>[] => [
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
    id: "announcements",
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
            aria-label="Toggle para Anuncios"
          />
        </div>
      );
    },
  },
   {
    id: "benefits",
    header: () => <div className="text-center">Beneficios</div>,
    cell: ({ row }) => {
      const supplier = row.original;
      const isLoading = loadingStates[supplier.id]?.canCreatePerks;

      return (
        <div className="flex justify-center">
          <Switch
            checked={!!supplier.canCreatePerks}
            onCheckedChange={(value) => onToggle(supplier.id, 'canCreatePerks', value)}
            disabled={isLoading}
            aria-label="Toggle para Beneficios"
          />
        </div>
      );
    },
  },
  {
    id: "appointments",
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
                aria-label="Toggle para Turnos"
            />
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Estado",
    cell: ({ row }) => {
        const isActive = row.original.announcementsEnabled || row.original.appointmentsEnabled || row.original.canCreatePerks;
        return <Badge variant={isActive ? 'default' : 'outline'}>{isActive ? "Activo" : "Inactivo"}</Badge>;
    },
  },
];
