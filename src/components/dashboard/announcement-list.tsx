'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, doc, deleteDoc } from 'firebase/firestore';
import { Announcement } from '@/types/data';
import { DataTable } from '@/components/ui/data-table';
import { columns as createColumns } from './announcement-columns';
import { UserRole } from '@/types/data';
import { AnnouncementFormDialog } from './announcement-form-dialog';
import { createConverter } from '@/lib/firestore-converter';

interface AnnouncementListProps {
    user: {
        uid: string;
        roles: UserRole[];
    };
}

export default function AnnouncementList({ user }: AnnouncementListProps) {
    const firestore = useFirestore();
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | undefined>();
    const [isFormOpen, setIsFormOpen] = useState(false);

    const announcementsQuery = useMemo(() => 
        query(
            collection(firestore, 'announcements').withConverter(createConverter<Announcement>()),
            where('supplierId', '==', user.uid)
        )
    , [firestore, user.uid]);

    const { data: announcements, isLoading, error } = useCollection(announcementsQuery);

    const handleEdit = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        setIsFormOpen(true);
    };

    const handleDelete = async (announcementId: string) => {
        if (confirm('¿Estás seguro de que quieres eliminar este anuncio?')) {
            await deleteDoc(doc(firestore, 'announcements', announcementId));
        }
    };

    // The columns themselves can cause re-renders if not memoized
    // especially since they receive functions as props.
    const columns = useMemo(() => createColumns({ onEdit: handleEdit, onDelete: handleDelete }), [handleEdit, handleDelete]);

    if (isLoading) return <p>Cargando anuncios...</p>;
    if (error) return <p className="text-destructive">Error al cargar los anuncios.</p>;

    return (
        <div>
            <DataTable columns={columns} data={announcements || []} />
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
        </div>
    );
}
