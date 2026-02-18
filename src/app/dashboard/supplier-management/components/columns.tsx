
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { SupplierProfile } from '@/types/data';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ColumnsProps {
  onToggle: (supplierId: string, capability: keyof SupplierProfile, isEnabled: boolean) => void;
  loadingStates: Record<string, Record<string, boolean>>;
}

export const columns = ({ onToggle, loadingStates }: ColumnsProps): ColumnDef<SupplierProfile>[] => [
  {
    accessorKey: 'displayName',
    header: 'Proveedor',
    cell: ({ row }) => {
      const { displayName, email } = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{displayName}</span>
          <span className="text-sm text-muted-foreground">{email}</span>
        </div>
      );
    },
  },
  {
    id: 'announcements',
    header: () => <div className="text-center">Anuncios</div>,
    cell: ({ row }) => {
      const supplier = row.original;
      const isLoading = loadingStates[supplier.id]?.announcementsEnabled || false;

      return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                     <div className="flex justify-center">
                        <Switch
                            checked={supplier.announcementsEnabled}
                            onCheckedChange={(isChecked) => onToggle(supplier.id, 'announcementsEnabled', isChecked)}
                            disabled={isLoading}
                            aria-label="Toggle announcements capability"
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{supplier.announcementsEnabled ? 'Deshabilitar' : 'Habilitar'} módulo de anuncios</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    id: 'appointments',
    header: () => <div className="text-center">Turnos</div>,
    cell: ({ row }) => {
      const supplier = row.original;
      const isLoading = loadingStates[supplier.id]?.appointmentsEnabled || false;

      return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex justify-center">
                        <Switch
                        checked={supplier.appointmentsEnabled}
                        onCheckedChange={(isChecked) => onToggle(supplier.id, 'appointmentsEnabled', isChecked)}
                        disabled={isLoading}
                        aria-label="Toggle appointments capability"
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{supplier.appointmentsEnabled ? 'Deshabilitar' : 'Habilitar'} módulo de turnos</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      );
    },
  },
];
