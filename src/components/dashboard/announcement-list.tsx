'use client';

import { useState, useMemo, useCallback } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, doc, deleteDoc } from 'firebase/firestore';
import { Announcement } from '@/types/data';
import { DataTable } from '@/components/ui/data-table';
import { columns as createColumns } from './announcement-columns';
import { UserRole } from '@/types/data';
import { AnnouncementFormDialog } from './announcement-form-dialog';
import { createConverter } from '@/lib/firestore-converter';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';

interface AnnouncementListProps {
    user: {
        uid: string;
        roles: UserRole[];
    };
}

export default function AnnouncementList({ user }: AnnouncementListProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | undefined>();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [announcementIdToDelete, setAnnouncementIdToDelete] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const announcementsQuery = useMemo(() => 
        query(
            collection(firestore, 'announcements').withConverter(createConverter<Announcement>()),
            where('supplierId', '==', user.uid)
        )
    , [firestore, user.uid]);

    const { data: announcements, isLoading, error } = useCollection(announcementsQuery);

    const handleEdit = useCallback((announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        setIsFormOpen(true);
    }, []);

    const handleDeleteRequest = useCallback((announcementId: string) => {
        setAnnouncementIdToDelete(announcementId);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!announcementIdToDelete) return;
        try {
            await deleteDoc(doc(firestore, 'announcements', announcementIdToDelete));
            toast({ title: 'Anuncio eliminado' });
        } catch (error) {
            console.error('Error deleting announcement:', error);
            toast({ variant: 'destructive', title: 'Error al eliminar' });
        } finally {
            setIsDeleteDialogOpen(false);
            setAnnouncementIdToDelete(null);
        }
    }, [announcementIdToDelete, firestore, toast]);

    const columns = useMemo(() => createColumns({ onEdit: handleEdit, onDelete: handleDeleteRequest }), [handleEdit, handleDeleteRequest]);

    if (isLoading) return <p>Cargando anuncios...</p>;
    if (error) return <p className="text-destructive">Error al cargar los anuncios.</p>;

    return (
        <div>
            <DataTable
              columns={columns}
              data={announcements || []}
              filterColumn="title"
              filterPlaceholder="Filtrar anuncios..."
            />
            <AnnouncementFormDialog
                isOpen={isFormOpen}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setSelectedAnnouncement(undefined);
                    }
                    setIsFormOpen(isOpen);
                }}
                announcement={selectedAnnouncement}
            />
            <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                title="¿Eliminar este anuncio?"
                description="Esta acción es permanente y no podrá ser revertida."
            />
        </div>
    );
}
