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
import { collection, serverTimestamp, addDoc, doc, updateDoc, query, collectionGroup } from 'firebase/firestore';
import { useState, useMemo } from 'react';
import { Save, Search, Layout, Database, Settings2, Eye, MessageSquare, Plus, Megaphone } from 'lucide-react';
import { HomeSection, Announcement, Banner, Benefit, SupplierProfile, benefitCategories, deliveryCategories, cluberCategories, WhereFilter, HomeSectionBlock, Product, Service } from '@/types/data';
import { Switch } from '@/components/ui/switch';
import { createConverter } from '@/lib/firestore-converter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

const formSchema = z.object({
  title: z.string().optional(),
  isActive: z.boolean().default(true),
  targetBoard: z.enum(['benefits', 'delivery', 'turns']).default('benefits'),
  
  contentType: z.enum(["benefits", "suppliers", "announcements", "announcements", "categories", "banner", "message", "benefits_nearby", "suppliers_nearby", "delivery_suppliers", "delivery_products", "delivery_promos", "productexmplsupplier", "minisuppliers", "supplierpromo", "professionals", "services", "products"]),

  layout_kind: z.enum(["carousel", "grid", "single"]),
  layout_gridPreset: z.enum(["1x4", "1x5", "2x4", "2x5"]).optional(),

  data_source_mode: z.enum(["auto", "manual"]),
  
  query_isFeatured: z.boolean().optional(),
  query_isVisible: z.boolean().optional(),
  query_category: z.string().optional(),
  query_deliveryCategory: z.string().optional(),
  query_supplierType: z.string().optional(),
  query_sort_field: z.string().optional(),
  query_sort_direction: z.enum(["asc", "desc"]).optional(),
  query_limit: z.coerce.number().optional(),

  manual_items: z.array(z.string()).optional(),
  manual_bannerId: z.string().optional(),
  message_title: z.string().optional(),
  message_body: z.string().optional(),
  message_imageUrl: z.string().optional(),
  message_alignment: z.enum(["left", "center"]).default("left"),
}).refine(data => {
    if (data.contentType === 'banner' && data.layout_kind === 'single') {
        return !!data.manual_bannerId;
    }
    return true;
}, {
    message: "Debes seleccionar un banner.",
    path: ["manual_bannerId"],
});


type FormValues = z.infer<typeof formSchema>;

interface HomeSectionFormProps {
    section?: HomeSection | null;
    onSuccess: () => void;
    defaultBoard: 'benefits' | 'delivery' | 'turns';
}

export function HomeSectionForm({ section, onSuccess, defaultBoard }: HomeSectionFormProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!section;
    
    // Data fetching for manual selection
    const benefitsQuery = useMemo(() => firestore ? query(collection(firestore, 'benefits').withConverter(createConverter<Benefit>())) : null, [firestore]);
    const { data: benefits } = useCollection(benefitsQuery);

    const suppliersQuery = useMemo(() => firestore ? query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>())) : null, [firestore]);
    const { data: suppliers } = useCollection(suppliersQuery);

    const bannersQuery = useMemo(() => firestore ? query(collection(firestore, 'banners').withConverter(createConverter<Banner>())) : null, [firestore]);
    const { data: banners } = useCollection(bannersQuery);

    const announcementsQuery = useMemo(() => firestore ? query(collection(firestore, 'announcements').withConverter(createConverter<Announcement>())) : null, [firestore]);
    const { data: announcements } = useCollection(announcementsQuery);

    const productsQuery = useMemo(() => firestore ? query(collectionGroup(firestore, 'products').withConverter(createConverter<Product>())) : null, [firestore]);
    const { data: products } = useCollection(productsQuery);

    const servicesQuery = useMemo(() => firestore ? query(collectionGroup(firestore, 'services').withConverter(createConverter<Service>())) : null, [firestore]);
    const { data: services } = useCollection(servicesQuery);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: useMemo(() => {
            const defaults = {
                title: '',
                isActive: true,
                targetBoard: defaultBoard,
                contentType: (defaultBoard === 'delivery' ? 'delivery_suppliers' : 'benefits') as any,
                layout_kind: 'carousel' as const,
                data_source_mode: 'auto' as const,
                query_isFeatured: false,
                query_isVisible: true,
                query_category: '',
                query_supplierType: '',
                query_sort_field: 'createdAt',
                query_sort_direction: 'desc' as const,
                query_limit: 10,
                manual_items: [],
                manual_bannerId: '',
                message_title: '',
                message_body: '',
                message_imageUrl: '',
                message_alignment: 'left' as const,
            };
            if (!section) return defaults;

            const { block } = section;
            const base = {
                title: section.title,
                isActive: section.isActive,
                targetBoard: section.targetBoard,
            };

            if (block.kind === 'banner') {
                return {
                    ...defaults,
                    ...base,
                    contentType: 'banner',
                    manual_bannerId: block.bannerId,
                };
            }
            if (block.kind === 'message') {
                return {
                    ...defaults,
                    ...base,
                    contentType: 'message',
                    message_title: block.message.title,
                    message_body: block.message.body,
                    message_imageUrl: block.message.imageUrl,
                    message_alignment: block.message.alignment || 'left',
                };
            }
            if (block.kind === 'categories') {
                return {
                    ...defaults,
                    ...base,
                    contentType: 'categories',
                };
            }
            
            const dynamicContentDefaults = {
                ...defaults,
                ...base,
                contentType: block.contentType,
                layout_kind: block.kind,
                data_source_mode: block.mode,
                ...(block.kind === 'grid' && block.layout && { layout_gridPreset: block.layout.gridPreset as any }),
            };

            if (block.mode === 'auto' && block.query) {
                const isVisibleFilter = block.query.filters?.find(f => f.field === 'isVisible' || f.field === 'isActive');
                return {
                    ...dynamicContentDefaults,
                    query_isFeatured: block.query.filters?.some(f => f.field === 'isFeatured' && f.value === true) || false,
                    query_isVisible: isVisibleFilter ? isVisibleFilter.value : true,
                    query_category: block.query.filters?.find(f => f.field === 'category')?.value as string || '',
                    query_deliveryCategory: block.query.filters?.find(f => f.field === 'deliveryCategory')?.value as string || '',
                    query_supplierType: block.query.filters?.find(f => f.field === 'type')?.value as string || '',
                    query_sort_field: block.query.sort?.field || 'createdAt',
                    query_sort_direction: block.query.sort?.direction || 'desc',
                    query_limit: block.query.limit || 10,
                }
            }
            if (block.mode === 'manual') {
                return {
                    ...dynamicContentDefaults,
                    manual_items: block.items || [],
                }
            }
            
            return dynamicContentDefaults;
        }, [section, defaultBoard]),
    });

    const watchContentType = form.watch('contentType');
    const watchLayoutKind = form.watch('layout_kind');
    const watchDataSourceMode = form.watch('data_source_mode');
    
    const [searchTerm, setSearchTerm] = useState('');
    const manualItems = form.watch('manual_items') || [];
    
    const selectableItems = useMemo(() => {
        let items: { id: string; name: string }[] = [];
        if (watchContentType === 'benefits' && benefits) items = benefits.map(b => ({ id: b.id, name: b.title }));
        if ((watchContentType === 'suppliers' || watchContentType === 'minisuppliers' || watchContentType === 'supplierpromo' || watchContentType === 'delivery_suppliers' || watchContentType === 'professionals') && suppliers) items = suppliers.map(s => ({ id: s.id, name: s.name }));
        if (watchContentType === 'announcements' && announcements) items = announcements.map(a => ({ id: a.id, name: a.title || `Anuncio sin título (${a.id.substring(0,5)})` }));
        if (watchContentType === 'banner' && banners) items = banners.map(b => ({ id: b.id, name: b.title || `Banner sin título (${b.id.substring(0,5)})` }));
        if ((watchContentType === 'delivery_products' || watchContentType === 'delivery_promos' || watchContentType === 'productexmplsupplier' || watchContentType === 'products') && products) items = products.map(p => ({ id: p.id, name: p.name }));
        if (watchContentType === 'services' && services) items = services.map(s => ({ id: s.id, name: s.name }));
        
        if (!searchTerm) return items;
        return items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [watchContentType, benefits, suppliers, announcements, banners, products, searchTerm]);

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
            let finalBlock: HomeSectionBlock;

            switch (values.contentType) {
                case 'banner':
                    if (values.layout_kind === 'single') {
                        finalBlock = {
                            kind: 'banner',
                            bannerId: values.manual_bannerId!,
                        };
                        break;
                    }
                    // If not single, fall through to default for carousel/grid
                case 'categories':
                    finalBlock = {
                        kind: 'categories',
                    };
                    break;
                case 'message':
                    finalBlock = {
                        kind: 'message',
                        message: {
                            title: values.message_title,
                            body: values.message_body || '',
                            imageUrl: values.message_imageUrl,
                            alignment: values.message_alignment as any,
                        }
                    };
                    break;
                case 'benefits_nearby':
                case 'suppliers_nearby':
                    finalBlock = {
                        kind: 'carousel',
                        contentType: values.contentType,
                        mode: 'auto',
                    };
                    break;
                default: // Dynamic content
                    const queryObj = {
                        filters: [] as WhereFilter[],
                        ...(values.query_sort_field && {
                            sort: { 
                                field: values.query_sort_field, 
                                direction: values.query_sort_direction as any || 'desc' 
                            }
                        }),
                        limit: values.query_limit || 10
                    };
                    
                    if (values.query_isVisible) {
                        const visibilityField = (values.contentType === 'announcements' || values.contentType === 'delivery_products' || values.contentType === 'delivery_promos' || values.contentType === 'productexmplsupplier' || values.contentType === 'minisuppliers' || values.contentType === 'supplierpromo' || values.contentType === 'products' || values.contentType === 'services') ? 'isActive' : 'isVisible';
                        queryObj.filters.push({ field: visibilityField, op: '==', value: true });
                    }

                    if (values.query_isFeatured) queryObj.filters.push({ field: 'isFeatured', op: '==', value: true });
                    if (values.query_category) queryObj.filters.push({ field: 'category', op: '==', value: values.query_category });
                    if (values.query_deliveryCategory) queryObj.filters.push({ field: 'deliveryCategory', op: '==', value: values.query_deliveryCategory });
                    if (values.query_supplierType) queryObj.filters.push({ field: 'type', op: '==', value: values.query_supplierType });

                    const commonDynamicProps = {
                        contentType: values.contentType as any,
                        mode: values.data_source_mode,
                        ...(values.data_source_mode === 'auto' && { query: queryObj }),
                        ...(values.data_source_mode === 'manual' && { items: values.manual_items || [] }),
                    };

                    if (values.layout_kind === 'carousel') {
                        finalBlock = {
                            kind: 'carousel',
                            ...commonDynamicProps,
                        };
                    } else { // grid
                        finalBlock = {
                            kind: 'grid',
                            layout: { gridPreset: values.layout_gridPreset },
                            ...commonDynamicProps,
                        };
                    }
                    break;
            }

            const dataToSave: Omit<HomeSection, 'id' | 'createdAt'> = {
                title: values.title || '',
                isActive: values.isActive,
                targetBoard: values.targetBoard,
                block: finalBlock as HomeSectionBlock,
                order: section?.order ?? new Date().getTime(),
            };

            if (isEditMode && section) {
                const sectionRef = doc(firestore, 'home_sections', section.id);
                await updateDoc(sectionRef, dataToSave as any);
                toast({ title: 'Bloque actualizado' });
            } else {
                await addDoc(collection(firestore, 'home_sections'), {
                    ...dataToSave,
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
    const isSpecialKind = watchContentType === 'categories' || watchContentType === 'message' || watchContentType === 'benefits_nearby' || watchContentType === 'suppliers_nearby';

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-1">
                {/* 1. General Config */}
                <div className="space-y-6 rounded-[2rem] border border-white/5 bg-card/30 p-8 shadow-premium">
                    <div className="space-y-1">
                        <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-orange-500" />
                            1. Configuración General
                        </h3>
                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Define el título y el board de destino.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Título de la Sección</FormLabel><FormControl><Input {...field} className="rounded-xl h-12 bg-background/50 border-white/5" placeholder="Ej: Ofertas Destacadas" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="targetBoard" render={({ field }) => (
                            <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Destino (Board)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="rounded-xl h-12 bg-background/50 border-white/5"><SelectValue /></SelectTrigger></FormControl><SelectContent className="rounded-xl border-white/5"><SelectItem value="benefits">Beneficios (Global)</SelectItem><SelectItem value="delivery">Delivery (Lite)</SelectItem><SelectItem value="turns">Turnos (Profesionales)</SelectItem></SelectContent></Select></FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="contentType" render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Tipo de Contenido</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="rounded-xl h-12 bg-background/50 border-white/5"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent className="rounded-xl border-white/5">
                                <SelectItem value="benefits">Beneficios</SelectItem>
                                <SelectItem value="suppliers">Proveedores (Clubers)</SelectItem>
                                <SelectItem value="delivery_suppliers">Delivery (Locales)</SelectItem>
                                <SelectItem value="benefits_nearby">Beneficios Cercanos (GPS)</SelectItem>
                                <SelectItem value="suppliers_nearby">Clubers Cercanos (GPS)</SelectItem>
                                <SelectItem value="announcements">Anuncios (Social / Feed)</SelectItem>
                                <Separator className="my-1" />
                                <SelectItem value="delivery_products">Delivery (Productos)</SelectItem>
                                <SelectItem value="delivery_promos">Delivery (Promociones)</SelectItem>
                                <SelectItem value="productexmplsupplier">Delivery (Tarjeta Detallada)</SelectItem>
                                <SelectItem value="minisuppliers">Delivery (Logos Circulares)</SelectItem>
                                <SelectItem value="supplierpromo">Delivery (Destacado Grande)</SelectItem>
                                <Separator className="my-1" />
                                <SelectItem value="categories">Grilla de Categorías</SelectItem>
                                <SelectItem value="banner">Banners Publicitarios (Imagen)</SelectItem>
                                <SelectItem value="message">Mensaje Home (Configurable)</SelectItem>
                                <Separator className="my-1" />
                                <SelectItem value="professionals">Turnos (Profesionales)</SelectItem>
                                <SelectItem value="services">Turnos (Servicios)</SelectItem>
                                <SelectItem value="products">Global (Productos)</SelectItem>
                            </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                </div>

                {/* 2. Presentation */}
                {!isSpecialKind && (
                    <div className="space-y-6 rounded-[2rem] border border-white/5 bg-card/30 p-8 shadow-premium">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                                <Layout className="h-5 w-5 text-orange-500" />
                                2. Presentación
                            </h3>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Elige cómo se visualizarán los elementos.</p>
                        </div>
                        <FormField control={form.control} name="layout_kind" render={({ field }) => (
                            <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Layout</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="rounded-xl h-12 bg-background/50 border-white/5"><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent className="rounded-xl border-white/5">
                                    <SelectItem value="carousel">Carrusel (Scroll Horizontal)</SelectItem>
                                    <SelectItem value="grid">Grilla (Estática)</SelectItem>
                                    {watchContentType === 'banner' && (
                                        <SelectItem value="single">Banner Individual (Estatico)</SelectItem>
                                    )}
                                </SelectContent>
                            </Select><FormMessage /></FormItem>
                        )} />
                        {watchLayoutKind === 'grid' && (
                            <FormField control={form.control} name="layout_gridPreset" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Diseño de Grilla</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="rounded-xl h-12 bg-background/50 border-white/5"><SelectValue placeholder="Selecciona un diseño" /></SelectTrigger></FormControl>
                                    <SelectContent className="rounded-xl border-white/5">
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

                {/* 3. Data Source */}
                 {(!isSpecialKind && watchLayoutKind !== 'single') && (
                     <div className="space-y-6 rounded-[2rem] border border-white/5 bg-card/30 p-8 shadow-premium">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                                <Database className="h-5 w-5 text-orange-500" />
                                3. Fuente de Datos
                            </h3>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Configura de dónde provienen los ítems.</p>
                        </div>

                        <Tabs 
                            value={watchDataSourceMode} 
                            onValueChange={(v) => form.setValue('data_source_mode', v as any)}
                            className="w-full"
                        >
                            <TabsList className="bg-background/50 border border-white/5 p-1 rounded-xl h-12 w-full mb-6">
                                <TabsTrigger value="auto" className="flex-1 rounded-lg font-black uppercase text-[9px] tracking-widest data-[state=active]:bg-orange-500 data-[state=active]:text-white">Automatizado</TabsTrigger>
                                <TabsTrigger value="manual" className="flex-1 rounded-lg font-black uppercase text-[9px] tracking-widest data-[state=active]:bg-orange-500 data-[state=active]:text-white">Manual</TabsTrigger>
                            </TabsList>

                            <TabsContent value="auto" className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500 focus-visible:outline-none">
                                <div className="grid grid-cols-2 gap-4">
                                     <FormField control={form.control} name="query_isFeatured" render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-2xl border border-white/5 bg-background/30 p-4 shadow-inner">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest">Solo Destacados</FormLabel>
                                            </div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name="query_isVisible" render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-2xl border border-white/5 bg-background/30 p-4 shadow-inner">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest">{watchContentType === 'announcements' ? 'Solo Activos' : 'Solo Visibles'}</FormLabel>
                                            </div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {watchContentType === 'benefits' && <FormField control={form.control} name="query_category" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Categoría (Opcional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="rounded-xl h-12 bg-background/50 border-white/5"><SelectValue placeholder="Todas las categorías" /></SelectTrigger></FormControl><SelectContent className="rounded-xl border-white/5">{benefitCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></FormItem>
                                    )} />}
                                    {watchContentType === 'delivery_suppliers' && <FormField control={form.control} name="query_deliveryCategory" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Categoría (Opcional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="rounded-xl h-12 bg-background/50 border-white/5"><SelectValue placeholder="Todas las categorías" /></SelectTrigger></FormControl><SelectContent className="rounded-xl border-white/5">{deliveryCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></FormItem>
                                    )} />}
                                </div>

                                <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-black/20 border border-white/5">
                                    <FormField control={form.control} name="query_sort_field" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Campo</FormLabel><FormControl><Input {...field} className="h-10 text-xs rounded-lg bg-background/50 border-white/10" placeholder="createdAt" /></FormControl></FormItem>
                                    )} />
                                     <FormField control={form.control} name="query_sort_direction" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Orden</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-10 text-xs rounded-lg bg-background/50 border-white/10"><SelectValue /></SelectTrigger></FormControl><SelectContent className="rounded-lg border-white/5"><SelectItem value="asc">ASC</SelectItem><SelectItem value="desc">DESC</SelectItem></SelectContent></Select></FormItem>
                                    )} />
                                    <FormField control={form.control} name="query_limit" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Límite</FormLabel><FormControl><Input type="number" {...field} className="h-10 text-xs rounded-lg bg-background/50 border-white/10" /></FormControl></FormItem>
                                    )} />
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="manual" className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500 focus-visible:outline-none">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                                    <Input 
                                        placeholder="Buscar por nombre..." 
                                        className="pl-12 h-14 rounded-2xl bg-background/50 border-white/10 focus:ring-orange-500/20" 
                                        value={searchTerm} 
                                        onChange={e => setSearchTerm(e.target.value)} 
                                    />
                                </div>
                                <ScrollArea className="h-80 rounded-2xl border border-white/5 bg-black/20 p-4">
                                    <div className="grid grid-cols-1 gap-2">
                                        {(selectableItems || []).map(item => (
                                            <div 
                                                key={item.id} 
                                                onClick={() => handleSelectItem(item.id)}
                                                className={cn(
                                                    "flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border",
                                                    manualItems.includes(item.id) 
                                                        ? "bg-orange-500/10 border-orange-500/30 text-orange-500" 
                                                        : "bg-white/5 border-transparent hover:bg-white/10"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Checkbox 
                                                        id={item.id} 
                                                        checked={manualItems.includes(item.id)} 
                                                        onCheckedChange={() => handleSelectItem(item.id)} 
                                                        className="data-[state=checked]:bg-orange-500 border-white/20"
                                                    />
                                                    <label htmlFor={item.id} className="text-xs font-bold uppercase tracking-widest cursor-pointer">{item.name}</label>
                                                </div>
                                                <Badge variant="outline" className="text-[8px] opacity-40 border-white/10">ID: {item.id.substring(0,6)}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <div className="flex justify-between items-center px-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">{manualItems.length} seleccionados</p>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => form.setValue('manual_items', [])} className="text-[9px] font-black uppercase opacity-40">Limpiar Todo</Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                     </div>
                 )}

                 {/* 4. Choice for Single Banner Selection (Manual) */}
                 {(watchContentType === 'banner' && watchLayoutKind === 'single') && (
                    <div className="space-y-6 rounded-[2rem] border border-white/5 bg-card/30 p-8 shadow-premium border-orange-500/20 bg-orange-500/5">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-orange-500" />
                                Configuración del Banner
                            </h3>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Selecciona una imagen de publicidad estática.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                                <Input 
                                    placeholder="Buscar banner por título..." 
                                    className="pl-12 h-14 rounded-2xl bg-background/50 border-white/10" 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                />
                            </div>

                            <ScrollArea className="h-48 rounded-2xl border border-white/5 bg-black/20 p-4">
                                <div className="grid grid-cols-1 gap-2">
                                    {(banners || []).filter(b => !searchTerm || b.title?.toLowerCase().includes(searchTerm.toLowerCase())).map(b => (
                                        <div 
                                            key={b.id} 
                                            onClick={() => form.setValue('manual_bannerId', b.id, { shouldDirty: true })}
                                            className={cn(
                                                "flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border",
                                                form.watch('manual_bannerId') === b.id 
                                                    ? "bg-orange-500/10 border-orange-500/30 text-orange-500" 
                                                    : "bg-white/5 border-transparent hover:bg-white/10"
                                            )}
                                        >
                                            <div className="w-16 h-10 rounded-lg overflow-hidden border border-white/10 bg-slate-800">
                                                <img src={b.imageUrl} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-black uppercase truncate">{b.title || 'Sin Título'}</p>
                                                <p className="text-[9px] opacity-40 truncate">ID: {b.id}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            
                            {form.watch('manual_bannerId') && banners?.find(b => b.id === form.watch('manual_bannerId')) && (
                                <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-white/5 animate-in fade-in zoom-in-95">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Previsualización de Imagen</p>
                                    <div className="aspect-[21/9] w-full rounded-xl overflow-hidden border border-white/10">
                                         <img 
                                            src={banners.find(b => b.id === form.watch('manual_bannerId'))?.imageUrl} 
                                            className="w-full h-full object-cover" 
                                         />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                 {/* 5. Special Kinds */}
                {watchContentType === 'message' && (
                    <div className="space-y-6 rounded-[2rem] border border-white/5 bg-card/30 p-8 shadow-premium border-primary/20 bg-primary/5">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-orange-500" />
                                Configuración del Mensaje
                            </h3>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Personaliza el mensaje directo en el Home.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <FormField control={form.control} name="message_title" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Título (Opcional)</FormLabel><FormControl><Input {...field} className="rounded-xl h-12 bg-background/50 border-white/5" placeholder="Ej: ¡Bienvenidos alumnos!" /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="message_body" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Cuerpo del Mensaje</FormLabel><FormControl><Input {...field} className="rounded-xl h-12 bg-background/50 border-white/5" placeholder="Ej: Descubre los mejores beneficios..." /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="message_imageUrl" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">URL de Imagen (Opcional)</FormLabel><FormControl><Input {...field} className="rounded-xl h-12 bg-background/50 border-white/5" placeholder="https://..." /></FormControl></FormItem>
                            )} />
                             <FormField control={form.control} name="message_alignment" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Alineación</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="rounded-xl h-12 bg-background/50 border-white/5"><SelectValue /></SelectTrigger></FormControl><SelectContent className="rounded-xl border-white/5"><SelectItem value="left">Izquierda</SelectItem><SelectItem value="center">Centro</SelectItem></SelectContent></Select></FormItem>
                            )} />
                        </div>
                        
                        <div className="mt-6 pt-6 border-t border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4">Previsualización</p>
                            <div className={cn(
                                "p-8 rounded-[2rem] glass glass-dark border border-white/10 flex flex-col md:flex-row items-center gap-6",
                                form.watch('message_alignment') === 'center' ? 'text-center flex-col' : 'text-left'
                            )}>
                                <div className="flex-1 space-y-2">
                                    <h4 className="text-3xl font-black tracking-tighter uppercase italic">{form.watch('message_title') || 'Título de ejemplo'}</h4>
                                    <p className="text-sm opacity-70 italic font-medium">{form.watch('message_body') || 'Cuerpo del mensaje de ejemplo...'}</p>
                                </div>
                                {form.watch('message_imageUrl') && (
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/20 shadow-2xl shrink-0">
                                        <img src={form.watch('message_imageUrl')} className="w-full h-full object-cover" alt="Preview" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. Status Card */}
                <div className="space-y-6 rounded-[2rem] border border-white/5 bg-card/30 p-8 shadow-premium">
                    <div className="space-y-1">
                        <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                            <Eye className="h-5 w-5 text-orange-500" />
                            4. Estado de Publicación
                        </h3>
                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Activa o desactiva este bloque.</p>
                    </div>
                     <FormField control={form.control} name="isActive" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-white/5 bg-background/30 p-4 shadow-inner">
                            <div className="space-y-0.5">
                                <FormLabel className="text-sm font-bold uppercase tracking-widest">Visibilidad Pública</FormLabel>
                                <FormDescription className="text-[10px] opacity-40 uppercase font-bold tracking-widest">Si está desactivado, no se mostrará en el Home.</FormDescription>
                            </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-orange-500" /></FormControl>
                        </FormItem>
                    )} />
                </div>

                <div className="flex justify-end items-center gap-4 pt-6 border-t border-white/5">
                     <Button type="button" variant="ghost" className="rounded-xl px-8 uppercase font-black text-[10px] tracking-widest opacity-40 hover:opacity-100 transition-opacity" onClick={onSuccess} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" className="rounded-xl px-10 h-14 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-lg shadow-orange-500/20" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>Procesando...</>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                {isEditMode ? 'Actualizar Bloque' : 'Crear Bloque'}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
