
'use client';

import { useMemo, useState } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc, writeBatch, addDoc, serverTimestamp } from 'firebase/firestore';
import { getCategoryColumns } from './category-columns';
import type { Category } from '@/types/data';
import { deliveryCategories, benefitCategories } from '@/types/data';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, RefreshCcw, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';
import { CategoryDialog } from './category-dialog';
import { createConverter } from '@/lib/firestore-converter';
import { cn } from '@/lib/utils';

interface CategoryTableProps {
    className?: string;
    search?: string;
}

export function CategoryTable({ className, search }: CategoryTableProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categoryIdToDelete, setCategoryIdToDelete] = useState<string | null>(null);
    const [isMigrating, setIsMigrating] = useState(false);

    const categoriesQuery = useMemo(() => 
        query(
            collection(firestore, 'categories').withConverter(createConverter<Category>()), 
            orderBy('order', 'asc')
        ), [firestore]);
    
    const { data: allCategories, isLoading } = useCollection(categoriesQuery);

    const categories = useMemo(() => {
        if (!allCategories) return [];
        if (!search) return allCategories;
        return allCategories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }, [allCategories, search]);

    const handleToggleActive = async (categoryId: string, isActive: boolean) => {
        const categoryRef = doc(firestore, 'categories', categoryId);
        try {
            await updateDoc(categoryRef, { isActive });
            toast({ title: 'Categoría actualizada', description: `La categoría ahora está ${isActive ? 'activa' : 'inactiva'}.` });
        } catch (error) {
            console.error('Error updating category status:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado.' });
        }
    };
    
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
            toast({ title: 'Categoría eliminada', description: 'La categoría ha sido borrada con éxito.' });
        } catch (error) {
            console.error('Error deleting category:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la categoría.' });
        } finally {
            setIsDeleteDialogOpen(false);
            setCategoryIdToDelete(null);
        }
    };

    // --- REORDERING LOGIC ---
    const handleMoveUp = async (category: Category) => {
        if (!categories || categories.length === 0) return;
        const currentIndex = categories.findIndex(c => c.id === category.id);
        if (currentIndex <= 0) return;

        const neighbor = categories[currentIndex - 1];
        await swapOrder(category, neighbor);
    };

    const handleMoveDown = async (category: Category) => {
        if (!categories || categories.length === 0) return;
        const currentIndex = categories.findIndex(c => c.id === category.id);
        if (currentIndex === -1 || currentIndex >= categories.length - 1) return;

        const neighbor = categories[currentIndex + 1];
        await swapOrder(category, neighbor);
    };

    const swapOrder = async (c1: Category, c2: Category) => {
        const batch = writeBatch(firestore);
        const c1Ref = doc(firestore, 'categories', c1.id);
        const c2Ref = doc(firestore, 'categories', c2.id);

        batch.update(c1Ref, { order: c2.order });
        batch.update(c2Ref, { order: c1.order });

        try {
            await batch.commit();
        } catch (error) {
            console.error('Error swapping category order:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el orden.' });
        }
    };

    // --- MIGRATION LOGIC ---
    const handleMigrate = async () => {
        setIsMigrating(true);
        const batch = writeBatch(firestore);
        const categoriesRef = collection(firestore, 'categories');

        try {
            // Seed from hardcoded lists
            let currentOrder = 0;
            
            deliveryCategories.forEach((name) => {
                const newDocRef = doc(categoriesRef);
                batch.set(newDocRef, {
                    name,
                    icon: '📦',
                    type: 'delivery',
                    isActive: true,
                    order: currentOrder++,
                    createdAt: serverTimestamp()
                });
            });

            benefitCategories.forEach((name) => {
                const newDocRef = doc(categoriesRef);
                batch.set(newDocRef, {
                    name,
                    icon: '🎁',
                    type: 'discount',
                    isActive: true,
                    order: currentOrder++,
                    createdAt: serverTimestamp()
                });
            });

            await batch.commit();
            toast({ title: 'Migración exitosa', description: 'Se han importado las categorías base.' });
        } catch (error) {
            console.error('Migration error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Falló la migración de datos.' });
        } finally {
            setIsMigrating(false);
        }
    };

    const columns = useMemo(() => getCategoryColumns(handleToggleActive, handleEdit, handleDeleteRequest, handleMoveUp, handleMoveDown), [categories]);

    return (
        <div className={className}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 bg-white/5 p-8 rounded-[3rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                    <Database className="h-32 w-32" />
                </div>
                <div className="space-y-1 relative z-10">
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase font-montserrat">Editor de <span className="text-primary italic">Categorías</span></h2>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Gestión dinámica del grid de navegación global.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
                    {(!categories || categories.length === 0) && !isLoading && (
                        <Button 
                            variant="outline" 
                            onClick={handleMigrate} 
                            disabled={isMigrating}
                            className="rounded-2xl h-14 px-6 border-primary/20 hover:bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                        >
                            {isMigrating ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                            Migrar Base
                        </Button>
                    )}
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="rounded-[1.5rem] h-14 px-10 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-primary/90 transition-all flex items-center gap-3 flex-1 md:flex-none">
                        <PlusCircle className="h-5 w-5" />
                        Añadir Nodo
                    </Button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={categories || []}
                isLoading={isLoading}
                filterColumn="name"
                filterPlaceholder="Buscar categorías..."
            />

            <CategoryDialog 
                isOpen={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                nextOrder={categories?.length || 0}
            />

            <CategoryDialog 
                isOpen={isEditDialogOpen}
                onOpenChange={(isOpen) => {
                    setIsEditDialogOpen(isOpen);
                    if (!isOpen) setSelectedCategory(null);
                }}
                category={selectedCategory}
            />

            <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                title="¿Eliminar categoría?"
                description="Esto podría afectar el filtrado en la aplicación si hay productos asociados."
            />
        </div>
    );
}
