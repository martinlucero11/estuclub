
'use client';

import { useMemo, useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getBannerColumns } from './banner-columns';
import type { Banner, SerializableBanner } from '@/lib/data';
import { makeBannerSerializable } from '@/lib/data';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { BannerDialog } from './banner-dialog';
import { useToast } from '@/hooks/use-toast';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';

export function BannerTable() {
    const firestore = useFirestore();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState<SerializableBanner | null>(null);
    const [bannerIdToDelete, setBannerIdToDelete] = useState<string | null>(null);

    const bannersQuery = useMemoFirebase(() => query(collection(firestore, 'banners'), orderBy('createdAt', 'desc')), [firestore]);
    const { data: banners, isLoading } = useCollection<Banner>(bannersQuery);

    const serializableBanners: SerializableBanner[] = useMemo(() => {
        if (!banners) return [];
        return banners.map(makeBannerSerializable);
    }, [banners]);

    const handleToggleActive = async (bannerId: string, isActive: boolean) => {
        const bannerRef = doc(firestore, 'banners', bannerId);
        try {
            await updateDoc(bannerRef, { isActive });
            toast({ title: 'Estado actualizado', description: `El banner ahora está ${isActive ? 'activo' : 'inactivo'}.` });
        } catch (error) {
            console.error('Error updating banner status:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado del banner.' });
        }
    };
    
    const handleEdit = (banner: SerializableBanner) => {
        setSelectedBanner(banner);
        setIsEditDialogOpen(true);
    };

    const handleDeleteRequest = (bannerId: string) => {
        setBannerIdToDelete(bannerId);
        setIsDeleteDialogOpen(true);
    };
    
    const handleDeleteConfirm = async () => {
        if (!bannerIdToDelete) return;
        const bannerRef = doc(firestore, 'banners', bannerIdToDelete);
        try {
            await deleteDoc(bannerRef);
            toast({ title: 'Banner eliminado', description: 'El banner ha sido eliminado con éxito.' });
        } catch (error) {
            console.error('Error deleting banner:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el banner.' });
        } finally {
            setIsDeleteDialogOpen(false);
            setBannerIdToDelete(null);
        }
    };

    const columns = useMemo(() => getBannerColumns(handleToggleActive, handleEdit, handleDeleteRequest), []);

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Banner
                </Button>
            </div>
            <DataTable
                columns={columns}
                data={serializableBanners}
                isLoading={isLoading}
                filterColumn="title"
                filterPlaceholder="Filtrar por título..."
            />
            <BannerDialog 
                isOpen={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />
            {selectedBanner && (
                 <BannerDialog 
                    isOpen={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    banner={selectedBanner}
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
