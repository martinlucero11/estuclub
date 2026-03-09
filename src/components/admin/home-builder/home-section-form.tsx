'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, serverTimestamp, addDoc, doc, updateDoc, query } from 'firebase/firestore';
import { useState, useMemo } from 'react';
import { Save, Search } from 'lucide-react';
import { HomeSection, Banner, Benefit, SupplierProfile, benefitCategories, cluberCategories, WhereFilter, Announcement } from '@/types/data';
import { Switch } from '@/components/ui/switch';
import { createConverter } from '@/lib/firestore-converter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  title: z.string().min(3, 'El título es requerido.'),
  isActive: z.boolean().default(true),
  
  // Section: Content
  contentType: z.enum(["benefits", "suppliers", "announcements", "categories", "banner"]),

  // Section: Presentation
  layout_kind: z.enum(["carousel", "grid"]),
  layout_gridPreset: z.enum(["1x4", "1x5", "2x4", "2x5"]).optional(),

  // Section: Data Source
  data_source_mode: z.enum(["automatic", "manual"]),
  
  // Fields for Automatic Mode
  query_isFeatured: z.boolean().optional(),
  query_isVisible: z.boolean().optional(),
  query_category: z.string().optional(),
  query_supplierType: z.string().optional(),
  query_sort_field: z.string().optional(),
  query_sort_direction: z.enum(["asc", "desc"]).optional(),
  query_limit: z.coerce.number().optional(),

  // Fields for Manual Mode
  manual_items: z.array(z.string()).optional(),
  manual_bannerId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface HomeSectionFormProps {
    section?: HomeSection | null;
    onSuccess: () => void;
}

export function HomeSectionForm({ section, onSuccess }: HomeSectionFormProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!section;
    
    // --- Data fetching for selects and manual mode ---
    const { data: banners } = useCollection(query(collection(firestore, 'banners').withConverter(createConverter<Banner>())));
    const { data: benefits } = useCollection(query(collection(firestore, 'benefits').withConverter(createConverter<Benefit>())));
    const { data: suppliers } = useCollection(query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>())));
    const { data: announcements } = useCollection(query(collection(firestore, 'announcements').withConverter(createConverter<Announcement>())));

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: section?.title || '',
            isActive: section?.isActive ?? true,
            contentType: section?.block.contentType || 'benefits',
            layout_kind: section?.block.kind === 'categories' || section?.block.kind === 'banner' ? 'grid' : section?.block.kind || 'carousel',
            layout_gridPreset: section?.block.layout?.gridPreset,
            data_source_mode: section?.block.mode || 'automatic',
            query_isFeatured: section?.block.query?.filters?.some(f => f.field === 'isFeatured' && f.value === true) || false,
            query_isVisible: section?.block.query?.filters?.some(f => f.field === 'isVisible' && f.value === true) || true, // default to true
            query_category: section?.block.query?.filters?.find(f => f.field === 'category')?.value || '',
            query_supplierType: section?.block.query?.filters?.find(f => f.field === 'type')?.value || '',
            query_sort_field: section?.block.query?.sort?.field || 'createdAt',
            query_sort_direction: section?.block.query?.sort?.direction || 'desc',
            query_limit: section?.block.query?.limit || 10,
            manual_items: section?.block.items || [],
            manual_bannerId: section?.block.bannerId,
        },
    });

    // --- Form watchers for conditional UI ---
    const watchContentType = form.watch('contentType');
    const watchLayoutKind = form.watch('layout_kind');
    const watchDataSourceMode = form.watch('data_source_mode');
    
    // --- State for manual item selector ---
    const [searchTerm, setSearchTerm] = useState('');
    const manualItems = form.watch('manual_items') || [];
    
    const selectableItems = useMemo(() => {
        let items: { id: string; name: string }[] = [];
        if (watchContentType === 'benefits' && benefits) items = benefits.map(b => ({ id: b.id, name: b.title }));
        if (watchContentType === 'suppliers' && suppliers) items = suppliers.map(s => ({ id: s.id, name: s.name }));
        if (watchContentType === 'announcements' && announcements) items = announcements.map(a => ({ id: a.id, name: a.title }));
        
        if (!searchTerm) return items;
        return items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [watchContentType, benefits, suppliers, announcements, searchTerm]);

    const handleSelectItem = (itemId: string) => {
        const currentItems = form.getValues('manual_items') || [];
        const newItems = currentItems.includes(itemId)
            ? currentItems.filter(id => id !== itemId)
            : [...currentItems, itemId];
        form.setValue('manual_items', newItems, { shouldDirty: true });
    };

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        try {
            // --- Build the final HomeSection object from form values ---
            const finalBlock: HomeSection['block'] = {
                kind: values.contentType === 'categories' || values.contentType === 'banner' ? values.contentType : values.layout_kind,
                contentType: (values.contentType !== 'categories' && values.contentType !== 'banner') ? values.contentType : undefined,
                mode: (values.contentType !== 'categories' && values.contentType !== 'banner') ? values.data_source_mode : undefined,
                layout: values.layout_kind === 'grid' ? { gridPreset: values.layout_gridPreset } : undefined,
                bannerId: values.contentType === 'banner' ? values.manual_bannerId : undefined,
                query: undefined,
                items: undefined,
            };

            if (finalBlock.mode === 'automatic') {
                const filters: WhereFilter[] = [];
                if (values.query_isVisible) filters.push({ field: 'isVisible', op: '==', value: true });
                if (values.query_isFeatured) filters.push({ field: 'isFeatured', op: '==', value: true });
                if (values.query_category) filters.push({ field: 'category', op: '==', value: values.query_category });
                if (values.query_supplierType) filters.push({ field: 'type', op: '==', value: values.query_supplierType });

                finalBlock.query = {
                    filters,
                    sort: {
                        field: values.query_sort_field || 'createdAt',
                        direction: values.query_sort_direction || 'desc',
                    },
                    limit: values.query_limit || 10,
                };
            }

            if (finalBlock.mode === 'manual') {
                finalBlock.items = values.manual_items || [];
            }
            
            const dataToSave = {
                title: values.title,
                isActive: values.isActive,
                block: finalBlock,
            };

            if (isEditMode && section) {
                const sectionRef = doc(firestore, 'home_sections', section.id);
                await updateDoc(sectionRef, dataToSave);
                toast({ title: 'Bloque actualizado' });
            } else {
                await addDoc(collection(firestore, 'home_sections'), {
                    ...dataToSave,
                    order: new Date().getTime(),
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Bloque creado' });
            }
            setIsSubmitting(false);
            onSuccess();
        } catch (error: any) {
            console.error("Error saving home section:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el bloque.' });
            setIsSubmitting(false);
        }
    }
    
    const isSpecialKind = watchContentType === 'categories' || watchContentType === 'banner';

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-1">

                {/* --- Section 1: Content --- */}
                <div className="space-y-4 rounded-md border p-4">
                    <h3 className="font-semibold text-lg">1. Contenido</h3>
                    <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Título del Bloque</FormLabel><FormControl><Input {...field} placeholder="Ej: Beneficios Destacados" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="contentType" render={({ field }) => (
                        <FormItem><FormLabel>Tipo de Contenido</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="benefits">Beneficios</SelectItem>
                                <SelectItem value="suppliers">Proveedores (Clubers)</SelectItem>
                                <SelectItem value="announcements">Anuncios</SelectItem>
                                <Separator className="my-1" />
                                <SelectItem value="categories">Grilla de Categorías</SelectItem>
                                <SelectItem value="banner">Banner Individual</SelectItem>
                            </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                </div>
                
                {/* --- Section 2: Presentation (Not for special kinds) --- */}
                {!isSpecialKind && (
                    <div className="space-y-4 rounded-md border p-4">
                        <h3 className="font-semibold text-lg">2. Presentación</h3>
                        <FormField control={form.control} name="layout_kind" render={({ field }) => (
                            <FormItem><FormLabel>Layout</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="carousel">Carrusel</SelectItem>
                                    <SelectItem value="grid">Grilla</SelectItem>
                                </SelectContent>
                            </Select><FormMessage /></FormItem>
                        )} />
                        {watchLayoutKind === 'grid' && (
                            <FormField control={form.control} name="layout_gridPreset" render={({ field }) => (
                                <FormItem><FormLabel>Diseño de Grilla</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un diseño" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="1x4">1 Fila x 4 Columnas</SelectItem>
                                        <SelectItem value="1x5">1 Fila x 5 Columnas</SelectItem>
                                        <SelectItem value="2x4">2 Filas x 4 Columnas</SelectItem>
                                        <SelectItem value="2x5">2 Filas x 5 Columnas</SelectItem>
                                    </SelectContent>
                                </Select><FormMessage /></FormItem>
                            )} />
                        )}
                    </div>
                )}

                {/* --- Section 3: Data Source (Not for special kinds) --- */}
                 {!isSpecialKind && (
                     <div className="space-y-4 rounded-md border p-4">
                        <h3 className="font-semibold text-lg">3. Fuente de Datos</h3>
                        <FormField control={form.control} name="data_source_mode" render={({ field }) => (
                            <FormItem><FormLabel>Modo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="automatic">Automático (con consulta)</SelectItem>
                                    <SelectItem value="manual">Manual (seleccionar ítems)</SelectItem>
                                </SelectContent>
                            </Select></FormItem>
                        )} />

                        {/* --- 3a: Automatic Mode --- */}
                        {watchDataSourceMode === 'automatic' && (
                             <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-2 gap-4">
                                     <FormField control={form.control} name="query_isFeatured" render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>Solo Destacados</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                                    )} />
                                     <FormField control={form.control} name="query_isVisible" render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>Solo Visibles</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                                    )} />
                                </div>
                                {watchContentType === 'benefits' && <FormField control={form.control} name="query_category" render={({ field }) => (
                                    <FormItem><FormLabel>Categoría de Beneficio (Opcional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Todas las categorías" /></SelectTrigger></FormControl><SelectContent>{benefitCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></FormItem>
                                )} />}
                                {watchContentType === 'suppliers' && <FormField control={form.control} name="query_supplierType" render={({ field }) => (
                                    <FormItem><FormLabel>Tipo de Proveedor (Opcional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Todos los tipos" /></SelectTrigger></FormControl><SelectContent>{cluberCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></FormItem>
                                )} />}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="query_sort_field" render={({ field }) => (
                                        <FormItem><FormLabel>Ordenar por</FormLabel><FormControl><Input {...field} placeholder="Ej: createdAt" /></FormControl></FormItem>
                                    )} />
                                     <FormField control={form.control} name="query_sort_direction" render={({ field }) => (
                                        <FormItem><FormLabel>Dirección</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="asc">Asc</SelectItem><SelectItem value="desc">Desc</SelectItem></SelectContent></Select></FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="query_limit" render={({ field }) => (
                                    <FormItem><FormLabel>Límite de Items</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                )} />
                             </div>
                        )}

                        {/* --- 3b: Manual Mode --- */}
                        {watchDataSourceMode === 'manual' && (
                             <div className="space-y-4 pt-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Buscar para añadir..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                                <ScrollArea className="h-64 rounded-md border">
                                    <div className="p-4 space-y-2">
                                        {selectableItems.map(item => (
                                            <div key={item.id} className="flex items-center space-x-2">
                                                <Checkbox id={item.id} checked={manualItems.includes(item.id)} onCheckedChange={() => handleSelectItem(item.id)} />
                                                <label htmlFor={item.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{item.name}</label>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <FormDescription>{manualItems.length} ítem(s) seleccionado(s).</FormDescription>
                             </div>
                        )}
                     </div>
                )}
                
                {/* --- Section Banner Specific --- */}
                {watchContentType === 'banner' && (
                    <div className="space-y-4 rounded-md border p-4">
                        <h3 className="font-semibold text-lg">Banner Específico</h3>
                        <FormField control={form.control} name="manual_bannerId" render={({ field }) => (
                            <FormItem><FormLabel>Banner a Mostrar</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un banner" /></SelectTrigger></FormControl>
                                <SelectContent>{banners?.map(b => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem>
                        )} />
                    </div>
                )}


                {/* --- Section 4: State --- */}
                <div className="space-y-4 rounded-md border p-4">
                    <h3 className="font-semibold text-lg">4. Estado</h3>
                     <FormField control={form.control} name="isActive" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5"><FormLabel>Activo</FormLabel><FormDescription>Desmarcar para ocultar este bloque de la Home.</FormDescription></div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                </div>


                <div className="flex justify-end items-center gap-4 pt-4">
                     <Button type="button" variant="ghost" onClick={onSuccess} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSubmitting ? 'Guardando...' : 'Guardar Bloque'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
