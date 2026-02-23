
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { getHomeSectionColumns } from './home-section-columns';
import type { HomeSection, SerializableHomeSection } from '@/lib/data';
import { makeHomeSectionSerializable } from '@/lib/data';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';
import { HomeSectionDialog } from './home-section-dialog';

export function HomeSectionTable() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState<HomeSection | null>(null);
    const [sectionIdToDelete, setSectionIdToDelete] = useState<string | null>(null);

    const sectionsQuery = useMemo(() => query(collection(firestore, 'home_sections'), orderBy('order', 'asc')), [firestore]);
    const { data: sections, isLoading } = useCollection<HomeSection>(sectionsQuery);

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

    const columns = useMemo(() => getHomeSectionColumns(handleToggleActive, handleEdit, handleDeleteRequest), []);

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
            />
            {selectedSection && (
                 <HomeSectionDialog 
                    isOpen={isEditDialogOpen}
                    onOpenChange={(isOpen) => {
                        setIsEditDialogOpen(isOpen);
                        if (!isOpen) setSelectedSection(null);
                    }}
                    section={selectedSection}
                />
            )}
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
