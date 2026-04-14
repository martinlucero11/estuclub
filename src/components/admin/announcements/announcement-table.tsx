
'use client';

import { useMemo, useState } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAnnouncementColumns } from './announcement-columns';
import type { Announcement } from '@/types/data';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Megaphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';
import { AnnouncementDialog } from './announcement-dialog';
import { createConverter } from '@/lib/firestore-converter';

interface AnnouncementTableProps {
    className?: string;
    search?: string;
}

export function AnnouncementTable({ className, search }: AnnouncementTableProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [announcementIdToDelete, setAnnouncementIdToDelete] = useState<string | null>(null);

    const announcementsQuery = useMemo(() => 
        query(
            collection(firestore, 'announcements').withConverter(createConverter<Announcement>()), 
            orderBy('submittedAt', 'desc')
        ), [firestore]);
    
    const { data: allAnnouncements, isLoading } = useCollection(announcementsQuery);

    const announcements = useMemo(() => {
        if (!allAnnouncements) return [];
        if (!search) return allAnnouncements;
        return allAnnouncements.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
    }, [allAnnouncements, search]);

    const handleToggleVisibility = async (announcementId: string, isVisible: boolean) => {
        const announcementRef = doc(firestore, 'announcements', announcementId);
        try {
            await updateDoc(announcementRef, { isVisible });
            toast({ title: 'Visibilidad actualizada', description: `El anuncio ahora está ${isVisible ? 'visible' : 'oculto'}.` });
        } catch (error) {
            console.error('Error updating announcement visibility:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la visibilidad.' });
        }
    };

    const handleApprove = async (announcementId: string) => {
        const announcementRef = doc(firestore, 'announcements', announcementId);
        try {
            await updateDoc(announcementRef, { status: 'approved', isVisible: true });
            
            // Trigger Real-Time Push Notification
            const announcement = allAnnouncements?.find(a => a.id === announcementId);
            if (announcement) {
                try {
                    await fetch('/api/notifications/notify-announcement', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: announcement.title,
                            content: announcement.content,
                            announcementId: announcement.id,
                            imageUrl: announcement.imageUrl,
                            supplierName: announcement.merchantName || 'Estuclub',
                            supplierId: announcement.supplierId,
                            targetType: announcement.notificationTarget || 'broadcast'
                        })
                    });
                } catch (notiError) {
                    console.error('Push error:', notiError);
                }
            }
            
            toast({ title: 'Anuncio Aprobado', description: 'La publicación ya es visible para los usuarios y se ha notificado a la comunidad.' });
        } catch (error) {
            console.error('Error approving:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo aprobar.' });
        }
    };

    const handleReject = async (announcementId: string) => {
        const announcementRef = doc(firestore, 'announcements', announcementId);
        try {
            await updateDoc(announcementRef, { status: 'rejected', isVisible: false });
            toast({ title: 'Anuncio Rechazado', description: 'El anuncio ha sido marcado como rechazado.' });
        } catch (error) {
            console.error('Error rejecting:', error);
        }
    };
    
    const handleEdit = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        setIsEditDialogOpen(true);
    };

    const handleDeleteRequest = (announcementId: string) => {
        setAnnouncementIdToDelete(announcementId);
        setIsDeleteDialogOpen(true);
    };
    
    const handleDeleteConfirm = async () => {
        if (!announcementIdToDelete) return;
        const announcementRef = doc(firestore, 'announcements', announcementIdToDelete);
        try {
            await deleteDoc(announcementRef);
            toast({ title: 'Anuncio eliminado', description: 'El registro ha sido borrado.' });
        } catch (error) {
            console.error('Error deleting:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo borrar.' });
        } finally {
            setIsDeleteDialogOpen(false);
            setAnnouncementIdToDelete(null);
        }
    };

    const columns = useMemo(() => getAnnouncementColumns(handleToggleVisibility, handleEdit, handleDeleteRequest, handleApprove, handleReject), []);

    return (
        <div className={className}>
            <div className="flex justify-between items-center mb-8 bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase font-montserrat flex items-center gap-2">
                        Cola de <span className="text-primary">Moderación</span>
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Gestión de anuncios de proveedores y locales.</p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="rounded-2xl h-14 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-primary/90 transition-all flex items-center gap-2">
                    <PlusCircle className="h-5 w-5" />
                    Nueva Emisión
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={announcements || []}
                isLoading={isLoading}
                filterColumn="title"
                filterPlaceholder="Filtrar por título..."
            />

            <AnnouncementDialog 
                isOpen={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />

            <AnnouncementDialog 
                isOpen={isEditDialogOpen}
                onOpenChange={(isOpen) => {
                    setIsEditDialogOpen(isOpen);
                    if (!isOpen) setSelectedAnnouncement(null);
                }}
                announcement={selectedAnnouncement}
            />

            <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                title="¿Eliminar anuncio?"
                description="Esta acción es irreversible y el anuncio desaparecerá de la base de datos."
            />
        </div>
    );
}
