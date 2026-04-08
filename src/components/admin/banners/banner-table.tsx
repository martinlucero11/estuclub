
'use client';

import { useMemo, useState } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAnnouncementColumns } from './banner-columns';
import type { Announcement } from '@/types/data';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';
import { AnnouncementDialog } from './banner-dialog';
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
    const [bannerIdToDelete, setAnnouncementIdToDelete] = useState<string | null>(null);

    const bannersQuery = useMemo(() => 
        query(
            collection(firestore, 'announcements').withConverter(createConverter<Announcement>()), 
            orderBy('createdAt', 'desc')
        ), [firestore]);
    
    const { data: allAnnouncements, isLoading } = useCollection(bannersQuery);

    const announcements = useMemo(() => {
        if (!allAnnouncements) return [];
        if (!search) return allAnnouncements;
        return allAnnouncements.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));
    }, [allAnnouncements, search]);

    const handleToggleActive = async (bannerId: string, isActive: boolean) => {
        const bannerRef = doc(firestore, 'announcements', bannerId);
        try {
            await updateDoc(bannerRef, { isActive });
            toast({ title: 'Estado actualizado', description: `El banner ahora está ${isActive ? 'activo' : 'inactivo'}.` });
        } catch (error) {
            console.error('Error updating banner status:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado.' });
        }
    };
    
    const handleEdit = (banner: Announcement) => {
        setSelectedAnnouncement(banner);
        setIsEditDialogOpen(true);
    };

    const handleDeleteRequest = (bannerId: string) => {
        setAnnouncementIdToDelete(bannerId);
        setIsDeleteDialogOpen(true);
    };
    
    const handleDeleteConfirm = async () => {
        if (!bannerIdToDelete) return;
        const bannerRef = doc(firestore, 'announcements', bannerIdToDelete);
        try {
            await deleteDoc(bannerRef);
            toast({ title: 'Announcement eliminado', description: 'El banner ha sido borrado con éxito.' });
        } catch (error) {
            console.error('Error deleting banner:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el banner.' });
        } finally {
            setIsDeleteDialogOpen(false);
            setAnnouncementIdToDelete(null);
        }
    };

    const columns = useMemo(() => getAnnouncementColumns(handleToggleActive, handleEdit, handleDeleteRequest), []);

    return (
        <div className={className}>
            <div className="flex justify-between items-center mb-8 bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase font-montserrat">Inventario de <span className="text-primary">Announcements</span></h2>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Piezas gráficas de la marquesina principal.</p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="rounded-2xl h-14 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-primary/90 transition-all flex items-center gap-2">
                    <PlusCircle className="h-5 w-5" />
                    Nuevo Announcement
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={banners || []}
                isLoading={isLoading}
                filterColumn="title"
                filterPlaceholder="Buscar por título..."
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
                banner={selectedAnnouncement}
            />

            <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                title="¿Eliminar este banner?"
                description="Esta acción eliminará el banner de la base de datos de forma permanente."
            />
        </div>
    );
}
