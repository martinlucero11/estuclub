
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc, writeBatch, where } from 'firebase/firestore';
import { getHomeSectionColumns } from './home-section-columns';
import type { HomeSection } from '@/types/data';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';
import { HomeSectionDialog } from '@/components/admin/home-builder/home-section-dialog';
import { createConverter } from '@/lib/firestore-converter';

interface HomeSectionTableProps {
    targetBoard: 'benefits' | 'delivery' | 'turns';
}

export function HomeSectionTable({ targetBoard }: HomeSectionTableProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState<HomeSection | null>(null);
    const [sectionIdToDelete, setSectionIdToDelete] = useState<string | null>(null);

    const sectionsQuery = useMemo(() => 
        query(
            collection(firestore, 'home_sections').withConverter(createConverter<HomeSection>()), 
            orderBy('order', 'asc')
        ), [firestore]);
    const { data: allSections, isLoading } = useCollection(sectionsQuery);

    const sections = useMemo(() => {
        if (!allSections) return [];
        return allSections.filter(s => (s.targetBoard || 'benefits') === targetBoard);
    }, [allSections, targetBoard]);

    const handleToggleActive = async (sectionId: string, isActive: boolean) => {
        const sectionRef = doc(firestore, 'home_sections', sectionId);
        try {
            await updateDoc(sectionRef, { isActive });
            toast({ title: 'Estado actualizado', description: `La sección ahora está ${isActive ? 'activa' : 'inactiva'}.` });
        } catch (error) {
            console.error('Error updating section status:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado de la sección.' });
        }
    };
    
    const handleEdit = (section: HomeSection) => {
        setSelectedSection(section);
        setIsEditDialogOpen(true);
    };

    const handleDeleteRequest = (sectionId: string) => {
        setSectionIdToDelete(sectionId);
        setIsDeleteDialogOpen(true);
    };
    
    const handleDeleteConfirm = async () => {
        if (!sectionIdToDelete) return;
        const sectionRef = doc(firestore, 'home_sections', sectionIdToDelete);
        try {
            await deleteDoc(sectionRef);
            toast({ title: 'Sección eliminada', description: 'La sección ha sido eliminada con éxito.' });
        } catch (error) {
            console.error('Error deleting section:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la sección.' });
        } finally {
            setIsDeleteDialogOpen(false);
            setSectionIdToDelete(null);
        }
    };

    const handleMoveUp = async (section: HomeSection) => {
        if (!sections || sections.length === 0) return;
        const currentIndex = sections.findIndex(s => s.id === section.id);
        if (currentIndex <= 0) return; // Already at the top

        const neighbor = sections[currentIndex - 1];
        await swapOrder(section, neighbor);
    };

    const handleMoveDown = async (section: HomeSection) => {
        if (!sections || sections.length === 0) return;
        const currentIndex = sections.findIndex(s => s.id === section.id);
        if (currentIndex === -1 || currentIndex >= sections.length - 1) return; // Already at the bottom

        const neighbor = sections[currentIndex + 1];
        await swapOrder(section, neighbor);
    };

    const swapOrder = async (s1: HomeSection, s2: HomeSection) => {
        const batch = writeBatch(firestore);
        const s1Ref = doc(firestore, 'home_sections', s1.id);
        const s2Ref = doc(firestore, 'home_sections', s2.id);

        batch.update(s1Ref, { order: s2.order });
        batch.update(s2Ref, { order: s1.order });

        try {
            await batch.commit();
            toast({ title: 'Orden actualizado', description: 'Las secciones han sido reordenadas.' });
        } catch (error) {
            console.error('Error swapping order:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el orden.' });
        }
    };

    const columns = useMemo(() => getHomeSectionColumns(handleToggleActive, handleEdit, handleDeleteRequest, handleMoveUp, handleMoveDown), [sections]);

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Sección
                </Button>
            </div>
            <DataTable
                columns={columns}
                data={sections || []}
                isLoading={isLoading}
                filterColumn="title"
                filterPlaceholder="Filtrar por título..."
            />
             <HomeSectionDialog 
                isOpen={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                defaultBoard={targetBoard}
            />
                  <HomeSectionDialog 
                    isOpen={isEditDialogOpen}
                    onOpenChange={(isOpen) => {
                        setIsEditDialogOpen(isOpen);
                        if (!isOpen) setSelectedSection(null);
                    }}
                    section={selectedSection}
                    defaultBoard={targetBoard}
                />
             <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                title="¿Eliminar esta sección?"
                description="Esta acción es permanente y no se puede deshacer. La sección desaparecerá de la página de inicio."
            />
        </>
    );
}

