'use client';

import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Service } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';

export default function ServiceManager() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const servicesQuery = useMemo(() => {
        if (!user) return null;
        return collection(firestore, 'roles_supplier', user.uid, 'services').withConverter(createConverter<Service>());
    }, [user, firestore]);

    const { data: services, isLoading, error } = useCollection(servicesQuery);

    const handleDelete = async () => {
        if (!user || !serviceToDelete) return;

        setIsDeleting(true);
        try {
            await deleteDoc(doc(firestore, 'roles_supplier', user.uid, 'services', serviceToDelete.id));
            toast({
                title: 'Servicio eliminado',
                description: `El servicio "${serviceToDelete.name}" ha sido eliminado.`,
            });
        } catch (err) {
            console.error('Error deleting service:', err);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo eliminar el servicio. Inténtalo de nuevo.',
            });
        } finally {
            setIsDeleting(false);
            setServiceToDelete(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <p>Error al cargar los servicios: {error.message}</p>
            </div>
        );
    }

    if (!services || services.length === 0) {
        return (
            <div className="text-center py-8 opacity-50 border-2 border-dashed rounded-lg">
                <p>No tienes servicios creados todavía.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(service => (
                    <Card key={service.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{service.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-1 mt-1">
                                        <Clock className="h-3 w-3" />
                                        {service.duration} minutos
                                    </CardDescription>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setServiceToDelete(service)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {service.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <DeleteConfirmationDialog 
                isOpen={!!serviceToDelete}
                onOpenChange={(open) => !open && setServiceToDelete(null)}
                onConfirm={handleDelete}
                title="¿Eliminar servicio?"
                description={`Estás a punto de eliminar "${serviceToDelete?.name}". Esta acción no se puede deshacer.`}
            />
        </div>
    );
}
