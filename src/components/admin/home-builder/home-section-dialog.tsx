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
    defaultBoard?: 'perks' | 'delivery';
}

export function HomeSectionDialog({ isOpen, onOpenChange, section, defaultBoard }: HomeSectionDialogProps) {
    const isEditMode = !!section;
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Editar Bloque de Inicio' : 'Crear Nuevo Bloque'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Modifica la configuración de este bloque.' : 'Configura un nuevo bloque de contenido para la página principal.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto pr-6 -mr-6">
                    <HomeSectionForm 
                        section={section} 
                        onSuccess={() => onOpenChange(false)}
                        defaultBoard={defaultBoard}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
