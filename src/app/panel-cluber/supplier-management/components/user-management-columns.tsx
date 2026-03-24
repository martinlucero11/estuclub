'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { SupplierProfile } from "@/types/data";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// The user data structure for the table
export interface UserForList {
    id: string;
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    dni: string;
}

// Props for creating columns, including the suppliers map and action handlers
interface CreateColumnsProps {
  suppliersMap: Map<string, SupplierProfile>;
  onEdit: (user: UserForList, supplierProfile: SupplierProfile | null) => void;
}

export const columns = ({ suppliersMap, onEdit }: CreateColumnsProps): ColumnDef<UserForList>[] => [
  {
    accessorKey: "firstName",
    header: "Nombre de Usuario",
    cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
  },
  {
    id: 'cluberName',
    header: "Nombre de Cluber",
    cell: ({ row }) => {
        const supplierProfile = suppliersMap.get(row.original.id);
        return supplierProfile ? <div className="font-medium">{supplierProfile.name}</div> : <span className="text-muted-foreground">N/A</span>;
    }
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Email <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
  },
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    id: 'isCluber',
    header: 'Rol',
    cell: ({ row }) => {
        const isSupplier = suppliersMap.has(row.original.id);
        return isSupplier ? <Badge>Cluber</Badge> : <Badge variant="outline">Usuario</Badge>;
    }
  },
  {
    id: "actions",
    header: () => <div className="text-right">Acciones</div>,
    cell: ({ row }) => {
      const user = row.original;
      const supplierProfile = suppliersMap.get(user.id) || null;
      const isSupplier = !!supplierProfile;

      return (
        <div className="text-right">
          <Button
            variant={isSupplier ? "outline" : "default"}
            size="sm"
            onClick={() => onEdit(user, supplierProfile)}
          >
            {isSupplier ? "Editar Cluber" : "Hacer Cluber"}
          </Button>
        </div>
      );
    },
  },
];
