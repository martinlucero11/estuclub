
'use client';

import { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { HomeSection } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { PlusCircle, Save, ArrowUp, ArrowDown, Edit, Trash2, LayoutTemplate } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdmin } from '@/firebase/auth/use-admin';
import AdminAccessDenied from '@/components/admin/admin-access-denied';
import BackButton from '@/components/layout/back-button';
import { createConverter } from '@/lib/firestore-converter';

const HomeSectionDialog = dynamic(() => import('@/components/admin/home-builder/home-section-dialog').then(mod => mod.HomeSectionDialog), { ssr: false });

function LoadingSkeleton() {
    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-80 mt-2" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                ))}
            </div>
        </div>
    );
}


export default function HomeBuilderPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { isAdmin, isLoading: isAdminLoading } = useAdmin();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState<HomeSection | null>(null);
    const [sectionIdToDelete, setSectionIdToDelete] = useState<string | null>(null);
    
    const [localSections, setLocalSections] = useState<HomeSection[]>([]);
    const [hasOrderChanged, setHasOrderChanged] = useState(false);

    const sectionsQuery = useMemo(() => query(collection(firestore, 'home_sections').withConverter(createConverter<HomeSection>()), orderBy('order', 'asc')), [firestore]);
    const { data: remoteSections, isLoading: isSectionsLoading } = useCollection(sectionsQuery);

    useEffect(() => {
        if (remoteSections) {
            setLocalSections(remoteSections);
        }
    }, [remoteSections]);

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newSections = [...localSections];
        const newIndex = direction === 'up' ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= newSections.length) return;

        // Swap items
        [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
        
        setLocalSections(newSections);
        setHasOrderChanged(true);
    };

    const handleSaveChanges = async () => {
        const batch = writeBatch(firestore);
        localSections.forEach((section, index) => {
            const docRef = doc(firestore, 'home_sections', section.id);
            batch.update(docRef, { order: index });
        });
        try {
            await batch.commit();
            toast({ title: 'Orden guardado', description: 'El nuevo orden de las secciones se ha guardado.' });
            setHasOrderChanged(false);
        } catch (error) {
            console.error('Error saving order:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el orden.' });
        }
    };
    
    const handleEdit = (section: HomeSection) => {
        setSelectedSection(section);
        setIsDialogOpen(true);
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
    
    const isLoading = isAdminLoading || isSectionsLoading;

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!isAdmin) {
        return <AdminAccessDenied title="Acceso Denegado" description="Solo los administradores pueden gestionar el diseño de la página de inicio."/>
    }

    return (
        <div className="space-y-4">
            <BackButton />
             <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">Diseño de Inicio</h1>
                    <p className="text-muted-foreground">
                        Arrastra y organiza los bloques de contenido que aparecen en la página principal.
                    </p>
                </div>
                <div className="flex gap-2">
                    {hasOrderChanged && (
                        <Button onClick={handleSaveChanges}>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Orden
                        </Button>
                    )}
                    <Button onClick={() => { setSelectedSection(null); setIsDialogOpen(true); }}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nuevo Bloque
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {localSections.length > 0 ? localSections.map((section, index) => (
                    <Card key={section.id} className="flex items-center p-4 gap-4">
                        <div className="flex flex-col gap-1">
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove(index, 'up')} disabled={index === 0}>
                                <ArrowUp className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove(index, 'down')} disabled={index === localSections.length - 1}>
                                <ArrowDown className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-lg">{section.title}</CardTitle>
                            <CardDescription>{section.type}</CardDescription>
                        </div>
                        <Badge variant={section.isActive ? 'default' : 'outline'}>
                            {section.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleEdit(section)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteRequest(section.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                )) : (
                     <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
                        <LayoutTemplate className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-semibold">Aún no hay secciones</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                           Empieza a construir tu página de inicio añadiendo un nuevo bloque.
                        </p>
                    </div>
                )}
            </div>
            
             <HomeSectionDialog 
                isOpen={isDialogOpen}
                onOpenChange={(isOpen) => {
                    setIsDialogOpen(isOpen);
                    if (!isOpen) setSelectedSection(null);
                }}
                section={selectedSection}
            />
             <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                title="¿Eliminar esta sección?"
                description="Esta acción es permanente y no se puede deshacer. La sección desaparecerá de la página de inicio."
            />
        </div>
    );
}
