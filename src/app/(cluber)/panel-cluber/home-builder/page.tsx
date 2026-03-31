'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
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

    const [activeBoard, setActiveBoard] = useState<'perks' | 'delivery'>('perks');
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
            const filtered = remoteSections.filter(s => (s.targetBoard || 'perks') === activeBoard);
            setLocalSections(filtered);
            setHasOrderChanged(false);
        }
    }, [remoteSections, activeBoard]);

    const handleMove = useCallback((index: number, direction: 'up' | 'down') => {
        setLocalSections(currentSections => {
            const newSections = [...currentSections];
            const newIndex = direction === 'up' ? index - 1 : index + 1;
    
            if (newIndex < 0 || newIndex >= newSections.length) return newSections;
    
            // Swap items
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

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!isAdmin) {
        return <AdminAccessDenied title="Acceso Denegado" description="Solo los administradores pueden gestionar el diseño de la página de inicio."/>
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-8">
            <BackButton />
            
            <Tabs defaultValue="perks" onValueChange={(v) => setActiveBoard(v as any)} className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Diseño de Inicio</h1>
                        <p className="text-muted-foreground font-medium">
                            Personaliza la experiencia para cada board (Beneficios / Delivery).
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <TabsList className="bg-muted/50 p-1 rounded-xl h-12">
                            <TabsTrigger value="perks" className="rounded-lg font-bold px-6 h-10 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                                Beneficios
                            </TabsTrigger>
                            <TabsTrigger value="delivery" className="rounded-lg font-bold px-6 h-10 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                                Delivery
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex gap-2">
                            {hasOrderChanged && (
                                <Button onClick={handleSaveChanges} className="h-12 rounded-xl font-bold shadow-lg shadow-primary/20 animate-in fade-in zoom-in-95">
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Orden
                                </Button>
                            )}
                            <Button onClick={() => { setSelectedSection(null); setIsDialogOpen(true); }} className="h-12 rounded-xl font-bold">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Nuevo Bloque
                            </Button>
                        </div>
                    </div>
                </div>

                <TabsContent value={activeBoard} className="space-y-6 pt-4 min-h-[400px]">
                    <div className="grid grid-cols-1 gap-4">
                        {localSections.length > 0 ? localSections.map((section, index) => {
                            const block = section.block;
                            
                            if (!block) {
                                return (
                                     <Card key={section.id} className="flex items-center p-4 gap-4 border-destructive bg-destructive/5">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg text-destructive">Error: Bloque no definido</CardTitle>
                                            <CardDescription>La configuración para la sección "{section.title}" está incompleta.</CardDescription>
                                        </div>
                                        <Button variant="destructive" size="icon" onClick={() => handleDeleteRequest(section.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </Card>
                                )
                            }

                            const description =
                                'contentType' in block && block.contentType
                                ? `${block.kind} · ${block.contentType}`
                                : block.kind;

                            return (
                                <Card key={section.id} className="flex flex-col sm:flex-row items-center p-4 gap-4 hover:shadow-md transition-all border-white/10 glass-card">
                                    <div className="flex sm:flex-col gap-1 w-full sm:w-auto">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10" onClick={() => handleMove(index, 'up')} disabled={index === 0}>
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10" onClick={() => handleMove(index, 'down')} disabled={index === localSections.length - 1}>
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                            <CardTitle className="text-lg font-bold">{section.title}</CardTitle>
                                            <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest opacity-60">
                                                {section.targetBoard || 'perks'}
                                            </Badge>
                                        </div>
                                        <CardDescription className="capitalize font-medium text-muted-foreground/80">{description}</CardDescription>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                        <Badge variant={section.isActive ? 'default' : 'secondary'} className={cn("rounded-full px-3 py-1 font-bold", section.isActive ? "bg-green-500 hover:bg-green-600" : "")}>
                                            {section.isActive ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                        <div className="flex gap-2">
                                            <Button variant="secondary" size="icon" onClick={() => handleEdit(section)} className="rounded-xl h-10 w-10">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="destructive" size="icon" onClick={() => handleDeleteRequest(section.id)} className="rounded-xl h-10 w-10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            )
                        }) : (
                             <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/50 p-16 text-center bg-muted/20 animate-in fade-in zoom-in-95">
                                <LayoutTemplate className="mx-auto h-20 w-20 text-muted-foreground/20 mb-6" />
                                <h3 className="text-2xl font-black tracking-tight text-foreground/80">Sin bloques en {activeBoard === 'perks' ? 'Beneficios' : 'Delivery'}</h3>
                                <p className="mt-3 text-base text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
                                   Empieza a construir tu página de inicio añadiendo un nuevo bloque para este modo.
                                </p>
                            </div>
                        )}
                    </div>

                    {hasOrderChanged && (
                        <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 text-center animate-in fade-in slide-in-from-bottom-2 mt-8">
                            <p className="text-primary font-black text-sm uppercase tracking-widest">Cambios de orden pendientes</p>
                            <p className="text-xs text-primary/70 font-bold mt-1">No olvides guardar para que se reflejen en la app.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <HomeSectionDialog 
                isOpen={isDialogOpen}
                onOpenChange={(isOpen) => {
                    setIsDialogOpen(isOpen);
                    if (!isOpen) setSelectedSection(null);
                }}
                section={selectedSection}
                defaultBoard={activeBoard}
            />
            <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpenConfirm}
                onOpenChange={setIsDeleteDialogOpenConfirm}
                onConfirm={handleDeleteConfirm}
                title="¿Eliminar esta sección?"
                description="Esta acción es permanente y no se puede deshacer. La sección desaparecerá de la página de inicio."
            />
        </div>
    );
}
