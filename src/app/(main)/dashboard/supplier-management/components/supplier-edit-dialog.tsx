'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SupplierEditForm } from './supplier-edit-form';
import type { SupplierProfile } from '@/types/data';

interface SupplierEditDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    supplier: SupplierProfile;
}

export function SupplierEditDialog({ isOpen, onOpenChange, supplier }: SupplierEditDialogProps) {
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Editar Perfil de Cluber</DialogTitle>
                    <DialogDescription>
                        Modifica los detalles del perfil de este Cluber.
                    </DialogDescription>
                </DialogHeader>
                <SupplierEditForm 
                    supplier={supplier} 
                    onSuccess={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
