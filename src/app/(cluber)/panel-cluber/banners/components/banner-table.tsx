'use client';

'use client';

import { useMemo, useState, useCallback } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAnnouncementColumns } from './banner-columns';
import type { Announcement, SerializableAnnouncement } from '@/types/data';
import { makeAnnouncementSerializable } from '@/lib/data';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AnnouncementDialog } from './banner-dialog';
import { useToast } from '@/hooks/use-toast';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';
import { createConverter } from '@/lib/firestore-converter';

export function AnnouncementTable() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<SerializableAnnouncement | null>(null);
    const [bannerIdToDelete, setAnnouncementIdToDelete] = useState<string | null>(null);

    const bannersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'announcements').withConverter(createConverter<Announcement>()), orderBy('createdAt', 'desc'));
    }, [firestore]);
    const { data: banners, isLoading } = useCollection(bannersQuery);

    const serializableAnnouncements: SerializableAnnouncement[] = useMemo(() => {
        if (!banners) return [];
        return banners.map(makeAnnouncementSerializable);
    }, [banners]);

    const handleToggleActive = useCallback(async (bannerId: string, isActive: boolean) => {
        const bannerRef = doc(firestore, 'announcements', bannerId);
        try {
            await updateDoc(bannerRef, { isActive });
            toast({ title: 'Estado actualizado', description: `El banner ahora está ${isActive ? 'activo' : 'inactivo'}.` });
        } catch (error) {
            console.error('Error updating banner status:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado del banner.' });
        }
    }, [firestore, toast]);
    
    const handleEdit = useCallback((banner: SerializableAnnouncement) => {
        setSelectedAnnouncement(banner);
        setIsEditDialogOpen(true);
    }, []);

    const handleDeleteRequest = useCallback((bannerId: string) => {
        setAnnouncementIdToDelete(bannerId);
        setIsDeleteDialogOpen(true);
    }, []);
    
    const handleDeleteConfirm = useCallback(async () => {
        if (!bannerIdToDelete) return;
        const bannerRef = doc(firestore, 'announcements', bannerIdToDelete);
        try {
            await deleteDoc(bannerRef);
            toast({ title: 'Announcement eliminado', description: 'El banner ha sido eliminado con éxito.' });
        } catch (error) {
            console.error('Error deleting banner:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el banner.' });
        } finally {
            setIsDeleteDialogOpen(false);
            setAnnouncementIdToDelete(null);
        }
    }, [bannerIdToDelete, firestore, toast]);

    const columns = useMemo(() => getAnnouncementColumns(handleToggleActive, handleEdit, handleDeleteRequest), [handleToggleActive, handleEdit, handleDeleteRequest]);

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Announcement
                </Button>
            </div>
            <DataTable
                columns={columns}
                data={serializableAnnouncements}
                isLoading={isLoading}
                filterColumn="title"
                filterPlaceholder="Filtrar por título..."
            />
            <AnnouncementDialog 
                isOpen={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />
            {selectedAnnouncement && (
                 <AnnouncementDialog 
                    isOpen={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    banner={selectedAnnouncement}
                />
            )}
             <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                title="¿Eliminar este banner?"
                description="Esta acción es permanente y no se puede deshacer. El banner desaparecerá de la página de inicio."
            />
        </>
    );
}

