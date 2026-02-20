
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { BannerForm } from './banner-form';
import type { SerializableBanner } from '@/lib/data';

interface BannerDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    banner?: SerializableBanner | null;
}

export function BannerDialog({ isOpen, onOpenChange, banner }: BannerDialogProps) {
    const isEditMode = !!banner;
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Editar Banner' : 'Crear Nuevo Banner'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Modifica los detalles de tu banner.' : 'Completa el formulario para añadir un nuevo banner.'}
                    </DialogDescription>
                </DialogHeader>
                <BannerForm 
                    banner={banner} 
                    onSuccess={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
