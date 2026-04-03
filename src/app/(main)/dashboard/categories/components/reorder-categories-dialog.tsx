'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import type { Category } from '@/types/data';
import { useToast } from '@/hooks/use-toast';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReorderCategoriesDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
}

export function ReorderCategoriesDialog({ isOpen, onOpenChange, categories: initialCategories }: ReorderCategoriesDialogProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Sync categories when prop changes or dialog opens
    useEffect(() => {
        if (isOpen && initialCategories.length > 0) {
            setCategories([...initialCategories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        }
    }, [initialCategories, isOpen]);
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newCategories = [...categories];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (newIndex < 0 || newIndex >= newCategories.length) return;

        const [movedItem] = newCategories.splice(index, 1);
        newCategories.splice(newIndex, 0, movedItem);
        setCategories(newCategories);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const batch = writeBatch(firestore);

        try {
            categories.forEach((category, index) => {
                const categoryRef = doc(firestore, 'categories', category.id);
                batch.update(categoryRef, { order: index });
            });

            await batch.commit();
            toast({
                title: 'Orden actualizado',
                description: 'Las categorías se han reordenado correctamente.',
            });
            onOpenChange(false);
        } catch (error) {
            console.error('Error reordering categories:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo guardar el nuevo orden.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Reordenar Categorías</DialogTitle>
                    <DialogDescription>
                        Usa las flechas para cambiar el orden en que aparecen las categorías en la pantalla de inicio.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2 mt-4">
                        {categories.map((category, index) => (
                            <div 
                                key={category.id} 
                                className="flex items-center gap-3 p-3 bg-background/30 rounded-lg border border-foreground group"
                            >
                                <span className="text-xl">{category.emoji}</span>
                                <span className="flex-1 font-medium">{category.name}</span>
                                
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={index === 0}
                                        onClick={() => handleMove(index, 'up')}
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={index === categories.length - 1}
                                        onClick={() => handleMove(index, 'down')}
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar Orden'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

