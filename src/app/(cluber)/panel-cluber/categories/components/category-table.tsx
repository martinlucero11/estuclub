
'use client';

import { useMemo, useState, useCallback } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { getCategoryColumns } from './category-columns';
import type { Category } from '@/types/data';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Shapes } from 'lucide-react';
import { CategoryDialog } from './category-dialog';
import { ReorderCategoriesDialog } from './reorder-categories-dialog';
import { useToast } from '@/hooks/use-toast';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';
import { createConverter } from '@/lib/firestore-converter';

export function CategoryTable({ type = 'perks' }: { type?: 'perks' | 'delivery' }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categoryIdToDelete, setCategoryIdToDelete] = useState<string | null>(null);

    const categoriesQuery = useMemo(() => collection(firestore, 'categories').withConverter(createConverter<Category>()), [firestore]);
    const { data: rawCategories, isLoading } = useCollection(categoriesQuery);
    const categories = useMemo(() => {
        if (!rawCategories) return [];
        return [...rawCategories]
            .filter(c => (c.type || 'perks') === type)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }, [rawCategories, type]);
    const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false);
    
    const handleEdit = useCallback((category: Category) => {
        setSelectedCategory(category);
        setIsEditDialogOpen(true);
    }, []);

    const handleDeleteRequest = useCallback((categoryId: string) => {
        setCategoryIdToDelete(categoryId);
        setIsDeleteDialogOpen(true);
    }, []);
    
    const handleDeleteConfirm = useCallback(async () => {
        if (!categoryIdToDelete) return;
        const categoryRef = doc(firestore, 'categories', categoryIdToDelete);
        try {
            await deleteDoc(categoryRef);
            toast({ title: 'Categoría eliminada', description: 'La categoría ha sido eliminada con éxito.' });
        } catch (error) {
            console.error('Error deleting category:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la categoría.' });
        } finally {
            setIsDeleteDialogOpen(false);
            setCategoryIdToDelete(null);
        }
    }, [categoryIdToDelete, firestore, toast]);

    const columns = useMemo(() => getCategoryColumns(handleEdit, handleDeleteRequest), [handleEdit, handleDeleteRequest]);

    return (
        <>
            <div className="flex justify-end gap-2 mb-4">
                <Button variant="outline" onClick={() => setIsReorderDialogOpen(true)}>
                    <Shapes className="mr-2 h-4 w-4" />
                    Reordenar
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Categoría
                </Button>
            </div>
            <DataTable
                columns={columns}
                data={categories || []}
                isLoading={isLoading}
                filterColumn="name"
                filterPlaceholder="Filtrar por nombre..."
            />
            <CategoryDialog 
                isOpen={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                defaultType={type}
            />
            {selectedCategory && (
                 <CategoryDialog 
                    isOpen={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    category={selectedCategory}
                />
            )}
             <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                title="¿Eliminar esta categoría?"
                description="Esta acción es permanente y no se puede deshacer."
            />
            {categories && (
                <ReorderCategoriesDialog 
                    isOpen={isReorderDialogOpen}
                    onOpenChange={setIsReorderDialogOpen}
                    categories={categories}
                />
            )}
        </>
    );
}

