'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, Timestamp, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2 } from 'lucide-react';
import EditAnnouncementDialog from '@/components/announcements/edit-announcement-dialog';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface Announcement {
    id: string;
    title: string;
    content: string;
    authorId: string;
    createdAt: Timestamp;
    imageUrl?: string;
}

const fallbackImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOMY2BgGwAFGwECEj4DKAAAAABJRU5ErkJggg==";

function AnnouncementAdminListItem({ announcement }: { announcement: Announcement }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const handleDelete = async () => {
        const announcementRef = doc(firestore, 'announcements', announcement.id);
        try {
            await deleteDoc(announcementRef);
            toast({
                title: 'Anuncio eliminado',
                description: 'El anuncio ha sido eliminado permanentemente.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo eliminar el anuncio.',
            });
            console.error("Error deleting announcement:", error);
        }
        setIsDeleteOpen(false);
    };

    const formattedDate = announcement.createdAt 
        ? announcement.createdAt.toDate().toLocaleDateString('es-ES')
        : 'N/A';

    return (
        <>
            <div className="flex items-center justify-between space-x-4 rounded-md border p-4">
                <div className="flex flex-1 items-center space-x-4">
                    <Image
                        src={announcement.imageUrl || fallbackImageUrl}
                        alt={announcement.title}
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-md object-cover"
                    />
                    <div className="flex-1">
                        <p className="font-medium">{announcement.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{announcement.content}</p>
                        <p className="text-xs text-muted-foreground pt-1">Publicado: {formattedDate}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" onClick={() => setIsEditOpen(true)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => setIsDeleteOpen(true)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                    </Button>
                </div>
            </div>
            <EditAnnouncementDialog
                announcement={announcement}
                isOpen={isEditOpen}
                onOpenChange={setIsEditOpen}
            />
            <DeleteConfirmationDialog
                isOpen={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onConfirm={handleDelete}
                title="¿Eliminar este anuncio?"
                description="Esta acción es permanente. El anuncio no podrá ser recuperado."
            />
        </>
    );
}

export default function AnnouncementAdminList({ authorId }: { authorId?: string }) {
    const firestore = useFirestore();

    const announcementsQuery = useMemo(
        () => {
            const baseCollection = collection(firestore, 'announcements');
            if (authorId) {
                return query(baseCollection, where('authorId', '==', authorId), orderBy('createdAt', 'desc'));
            }
            return query(baseCollection, orderBy('createdAt', 'desc'));
        },
        [firestore, authorId]
    );

    const { data: announcements, isLoading, error } = useCollection<Announcement>(announcementsQuery);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 rounded-md border p-4">
                         <Skeleton className="h-16 w-16 rounded-md" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return <p className="text-destructive">Error al cargar los anuncios: {error.message}</p>;
    }

    if (!announcements || announcements.length === 0) {
        return (
            <p className="text-center text-muted-foreground">No hay anuncios para mostrar.</p>
        );
    }

    return (
        <div className="space-y-4">
            {announcements.map((announcement) => (
                <AnnouncementAdminListItem key={announcement.id} announcement={announcement} />
            ))}
        </div>
    );
}
