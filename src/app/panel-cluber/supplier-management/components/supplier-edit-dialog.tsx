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
import type { UserForList } from './user-management-columns';

interface SupplierEditDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserForList;
    supplierProfile: SupplierProfile | null;
}

export function SupplierEditDialog({ isOpen, onOpenChange, user, supplierProfile }: SupplierEditDialogProps) {
    const isEditMode = !!supplierProfile;
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Editar Perfil de Cluber' : 'Hacer Cluber'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Modifica los detalles del perfil de este Cluber.' : `Estás a punto de convertir al usuario ${user.email} en un Cluber.`}
                    </DialogDescription>
                </DialogHeader>
                <SupplierEditForm 
                    user={user}
                    supplierProfile={supplierProfile} 
                    onSuccess={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
