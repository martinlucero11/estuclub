
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
import { useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { homeSectionTypes, HomeSection, Banner, HomeSectionType } from '@/types/data';
import { Switch } from '@/components/ui/switch';
import { createConverter } from '@/lib/firestore-converter';

const formSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
  type: z.enum(homeSectionTypes, { required_error: 'Debes seleccionar un tipo.' }),
  isActive: z.boolean().default(true),
  filter: z.string().optional(),
  bannerId: z.string().optional(),
});

interface HomeSectionFormProps {
    section?: HomeSection | null;
    onSuccess: () => void;
}

const sectionTypeLabels: Record<HomeSectionType, string> = {
    categories_grid: "Grilla de Categorías",
    benefits_carousel: "Carrusel de Beneficios",
    single_banner: "Banner Individual",
    suppliers_carousel: "Carrusel de Proveedores",
    announcements_carousel: "Carrusel de Anuncios",
    featured_suppliers_carousel: "Carrusel de Proveedores Destacados",
    new_suppliers_carousel: "Carrusel de Nuevos Proveedores",
    featured_perks: "Beneficios Destacados",
};


export function HomeSectionForm({ section, onSuccess }: HomeSectionFormProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!section;

    const bannersQuery = useMemo(() => query(collection(firestore, 'banners').withConverter(createConverter<Banner>())), [firestore]);
    const { data: banners } = useCollection(bannersQuery);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: section?.title || '',
            type: section?.type || undefined,
            isActive: section?.isActive ?? true,
            filter: section?.filter || '',
            bannerId: section?.bannerId || '',
        },
    });

    const selectedType = form.watch('type');

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const dataToSave: Partial<HomeSection> = {
                title: values.title,
                type: values.type,
                isActive: values.isActive,
                filter: values.type === 'benefits_carousel' ? values.filter : '',
                bannerId: values.type === 'single_banner' ? values.bannerId : '',
            };
            
            if (isEditMode && section) {
                const sectionRef = doc(firestore, 'home_sections', section.id);
                await updateDoc(sectionRef, dataToSave);
                toast({ title: 'Sección actualizada', description: 'Los cambios han sido guardados.' });
            } else {
                const newOrder = new Date().getTime(); // Simple way to ensure it's last
                await addDoc(collection(firestore, 'home_sections'), {
                    ...dataToSave,
                    order: newOrder,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Sección creada', description: 'La nueva sección ha sido añadida.' });
            }
            onSuccess();
        } catch (error: any) {
            console.error("Error saving home section:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo guardar la sección. Inténtalo de nuevo.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Bloque</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo de contenido" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {homeSectionTypes.map(type => (
                                        <SelectItem key={type} value={type}>
                                            {sectionTypeLabels[type] || type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {selectedType === 'benefits_carousel' && (
                     <FormField
                        control={form.control}
                        name="filter"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Filtro de Categoría</FormLabel>
                                <FormControl><Input {...field} placeholder="Ej: Comida o featured" /></FormControl>
                                <FormDescription>El nombre de la categoría a mostrar, o la palabra 'featured' para los destacados.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {selectedType === 'single_banner' && (
                     <FormField
                        control={form.control}
                        name="bannerId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Banner a mostrar</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un banner" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {banners?.map(b => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5"><FormLabel>Activa</FormLabel></div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}
                />
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSubmitting ? 'Guardando...' : 'Guardar Sección'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
