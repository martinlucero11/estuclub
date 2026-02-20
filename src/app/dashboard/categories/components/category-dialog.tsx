'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CategoryForm } from './category-form';
import type { Category } from '@/lib/data';

interface CategoryDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    category?: Category | null;
}

export function CategoryDialog({ isOpen, onOpenChange, category }: CategoryDialogProps) {
    const isEditMode = !!category;
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Editar Categoría' : 'Crear Nueva Categoría'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Modifica los detalles de la categoría.' : 'Completa el formulario para añadir una nueva categoría.'}
                    </DialogDescription>
                </DialogHeader>
                <CategoryForm 
                    category={category} 
                    onSuccess={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
