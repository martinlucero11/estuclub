'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState, useEffect, useCallback } from 'react';
import nextDynamic from 'next/dynamic';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { HomeSection } from '@/types/data';
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
import { cn } from '@/lib/utils';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';

const HomeSectionDialog = nextDynamic(() => import('@/components/admin/home-builder/home-section-dialog').then(mod => mod.HomeSectionDialog), { ssr: false });

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

    const [activeBoard, setActiveBoard] = useState<'benefits' | 'delivery'>('benefits');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpenConfirm, setIsDeleteDialogOpenConfirm] = useState(false);
    const [selectedSection, setSelectedSection] = useState<HomeSection | null>(null);
    const [sectionIdToDelete, setSectionIdToDelete] = useState<string | null>(null);

    const [localSections, setLocalSections] = useState<HomeSection[]>([]);
    const [hasOrderChanged, setHasOrderChanged] = useState(false);

    const sectionsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'home_sections').withConverter(createConverter<HomeSection>()),
            orderBy('order', 'asc')
        );
    }, [firestore]);
    const { data: remoteSections, isLoading: isSectionsLoading } = useCollection(sectionsQuery);

    useEffect(() => {
        if (remoteSections) {
            const filtered = remoteSections.filter(s => (s.targetBoard || 'benefits') === activeBoard);
            setLocalSections(filtered);
            setHasOrderChanged(false);
        }
    }, [remoteSections, activeBoard]);

    const handleMove = useCallback((index: number, direction: 'up' | 'down') => {
        setLocalSections(currentSections => {
            const newSections = [...currentSections];
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= newSections.length) return newSections;
            [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
            return newSections;
        });
        setHasOrderChanged(true);
    }, []);

    const handleSaveChanges = useCallback(async () => {
        if (!firestore) return;
        const batch = writeBatch(firestore);
        localSections.forEach((section, index) => {
            const docRef = doc(firestore, 'home_sections', section.id);
            batch.update(docRef, { order: index });
        });
        try {
            await batch.commit();
            toast({ title: 'Orden guardado', description: `El nuevo orden de secciones para ${activeBoard} se ha guardado.` });
            setHasOrderChanged(false);
        } catch (error) {
            console.error('Error saving order:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el orden.' });
        }
    }, [firestore, localSections, toast, activeBoard]);

    const handleEdit = useCallback((section: HomeSection) => {
        setSelectedSection(section);
        setIsDialogOpen(true);
    }, []);

    const handleDeleteRequest = useCallback((sectionId: string) => {
        setSectionIdToDelete(sectionId);
        setIsDeleteDialogOpenConfirm(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!sectionIdToDelete || !firestore) return;
        const sectionRef = doc(firestore, 'home_sections', sectionIdToDelete);
        try {
            await deleteDoc(sectionRef);
            toast({ title: 'Sección eliminada', description: 'La sección ha sido eliminada con éxito.' });
        } catch (error) {
            console.error('Error deleting section:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la sección.' });
        } finally {
            setIsDeleteDialogOpenConfirm(false);
            setSectionIdToDelete(null);
        }
    }, [sectionIdToDelete, firestore, toast]);

    const isLoading = isAdminLoading || isSectionsLoading;

    if (isLoading) return <LoadingSkeleton />;

    if (!isAdmin) {
        return <AdminAccessDenied title="Acceso Denegado" description="Solo los administradores pueden gestionar el diseño de inicio." />
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-8">
            <BackButton />
            <Tabs defaultValue="benefits" onValueChange={(v) => setActiveBoard(v as any)} className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Diseño de Inicio</h1>
                        <p className="text-foreground font-medium">Configura los bloques de la App.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <TabsList className="bg-background/50 p-1 rounded-xl h-12">
                            <TabsTrigger value="benefits" className="rounded-lg font-bold px-6 h-10 data-[state=active]:bg-primary data-[state=active]:text-white">Beneficios</TabsTrigger>
                            <TabsTrigger value="delivery" className="rounded-lg font-bold px-6 h-10 data-[state=active]:bg-primary data-[state=active]:text-white">Delivery</TabsTrigger>
                        </TabsList>
                        <div className="flex gap-2">
                            {hasOrderChanged && (
                                <Button onClick={handleSaveChanges} className="h-12 rounded-xl font-bold">
                                    <Save className="mr-2 h-4 w-4" /> Guardar
                                </Button>
                            )}
                            <Button onClick={() => { setSelectedSection(null); setIsDialogOpen(true); }} className="h-12 rounded-xl font-bold">
                                <PlusCircle className="mr-2 h-4 w-4" /> Nuevo
                            </Button>
                        </div>
                    </div>
                </div>

                <TabsContent value={activeBoard} className="space-y-4">
                    {localSections.length > 0 ? localSections.map((section, index) => (
                        <Card key={section.id} className="flex flex-col sm:flex-row items-center p-4 gap-4 glass-card">
                            <div className="flex sm:flex-col gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleMove(index, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleMove(index, 'down')} disabled={index === localSections.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg font-bold">{section.title}</CardTitle>
                                <CardDescription>{section.block?.kind || 'Sección'}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={section.isActive ? 'default' : 'secondary'}>{section.isActive ? 'Activo' : 'Inactivo'}</Badge>
                                <Button variant="secondary" size="icon" onClick={() => handleEdit(section)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="destructive" size="icon" onClick={() => handleDeleteRequest(section.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </Card>
                    )) : (
                        <div className="text-center py-20 border-2 border-dashed rounded-3xl">
                            <LayoutTemplate className="mx-auto h-12 w-12 opacity-20 mb-4" />
                            <p>No hay bloques configurados.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <HomeSectionDialog
                isOpen={isDialogOpen}
                onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setSelectedSection(null); }}
                section={selectedSection}
                defaultBoard={activeBoard}
            />
            <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpenConfirm}
                onOpenChange={setIsDeleteDialogOpenConfirm}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}
