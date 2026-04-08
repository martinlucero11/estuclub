
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AnnouncementForm } from './banner-form';
import type { SerializableAnnouncement } from '@/types/data';

interface AnnouncementDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    banner?: SerializableAnnouncement | null;
}

export function AnnouncementDialog({ isOpen, onOpenChange, banner }: AnnouncementDialogProps) {
    const isEditMode = !!banner;
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Editar Announcement' : 'Crear Nuevo Announcement'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Modifica los detalles de tu banner.' : 'Completa el formulario para añadir un nuevo banner.'}
                    </DialogDescription>
                </DialogHeader>
                <AnnouncementForm 
                    banner={banner} 
                    onSuccess={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

