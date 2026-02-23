'use client';

import { useMemo, useState } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { getCategoryColumns } from './category-columns';
import type { Category } from '@/lib/data';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { CategoryDialog } from './category-dialog';
import { useToast } from '@/hooks/use-toast';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';

export function CategoryTable() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categoryIdToDelete, setCategoryIdToDelete] = useState<string | null>(null);

    const categoriesQuery = useMemo(() => query(collection(firestore, 'categories'), orderBy('name', 'asc')), [firestore]);
    const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);
    
    const handleEdit = (category: Category) => {
        setSelectedCategory(category);
        setIsEditDialogOpen(true);
    };

    const handleDeleteRequest = (categoryId: string) => {
        setCategoryIdToDelete(categoryId);
        setIsDeleteDialogOpen(true);
    };
    
    const handleDeleteConfirm = async () => {
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
    };

    const columns = useMemo(() => getCategoryColumns(handleEdit, handleDeleteRequest), []);

    return (
        <>
            <div className="flex justify-end mb-4">
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
        </>
    );
}
