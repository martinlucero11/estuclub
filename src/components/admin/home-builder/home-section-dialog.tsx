'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { HomeSectionForm } from './home-section-form';
import type { HomeSection } from '@/types/data';

interface HomeSectionDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    section?: HomeSection | null;
}

export function HomeSectionDialog({ isOpen, onOpenChange, section }: HomeSectionDialogProps) {
    const isEditMode = !!section;
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Editar Sección' : 'Crear Nueva Sección'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Modifica los detalles de la sección.' : 'Completa el formulario para añadir una nueva sección a la Home.'}
                    </DialogDescription>
                </DialogHeader>
                <HomeSectionForm 
                    section={section} 
                    onSuccess={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
