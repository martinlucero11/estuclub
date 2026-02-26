'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp, getDocs, collection, query, where, limit } from 'firebase/firestore';
import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { SupplierProfile, cluberCategories } from '@/types/data';
import { Switch } from '@/components/ui/switch';
import type { UserForList } from './user-management-columns';

const formSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  slug: z.string().min(2, 'El slug debe tener al menos 2 caracteres.'),
  type: z.enum(cluberCategories, { required_error: 'Debes seleccionar una categoría.' }),
  description: z.string().optional(),
  logoUrl: z.string().url('URL de logo no válida').optional().or(z.literal('')),
  address: z.string().optional(),
  whatsapp: z.string().optional(),
  appointmentsEnabled: z.boolean().default(false),
  announcementsEnabled: z.boolean().default(false),
  canCreatePerks: z.boolean().default(false),
});

interface SupplierEditFormProps {
    user: UserForList;
    supplierProfile: SupplierProfile | null;
    onSuccess: () => void;
}

function slugify(text: string): string {
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return text.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}


export function SupplierEditForm({ user, supplierProfile, onSuccess }: SupplierEditFormProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!supplierProfile;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: supplierProfile?.name || '',
            slug: supplierProfile?.slug || slugify(supplierProfile?.name || user.username),
            type: supplierProfile?.type || 'Comercio',
            description: supplierProfile?.description || '',
            logoUrl: supplierProfile?.logoUrl || '',
            address: supplierProfile?.address || '',
            whatsapp: supplierProfile?.whatsapp || '',
            appointmentsEnabled: supplierProfile?.appointmentsEnabled || false,
            announcementsEnabled: supplierProfile?.announcementsEnabled || false,
            canCreatePerks: supplierProfile?.canCreatePerks || true,
        },
    });

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        form.setValue('name', e.target.value);
        if (!form.formState.dirtyFields.slug) {
            form.setValue('slug', slugify(e.target.value));
        }
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const suppliersRef = collection(firestore, 'roles_supplier');
            const q = query(suppliersRef, where('slug', '==', values.slug), limit(1));
            const slugSnapshot = await getDocs(q);

            if (!slugSnapshot.empty && slugSnapshot.docs[0].id !== user.id) {
                form.setError('slug', { message: 'Este slug ya está en uso por otro Cluber.' });
                setIsSubmitting(false);
                return;
            }

            const supplierDocRef = doc(firestore, 'roles_supplier', user.id);
            const dataToSave = {
                ...values,
                userId: user.id,
                email: user.email,
                ...(isEditMode ? {} : { createdAt: serverTimestamp() }),
            };
            
            await setDoc(supplierDocRef, dataToSave, { merge: true });

            toast({
                title: isEditMode ? 'Cluber Actualizado' : '¡Usuario ahora es un Cluber!',
                description: `El perfil de ${user.email} ha sido ${isEditMode ? 'actualizado' : 'creado'}.`,
            });
            onSuccess();
        } catch (error: any) {
            console.error("Error saving supplier profile:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo guardar el perfil del Cluber.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del Cluber</FormLabel>
                            <FormControl>
                                <Input {...field} onChange={handleNameChange} placeholder="Ej: Café Martínez"/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Slug (URL)</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Ej: cafe-martinez"/>
                            </FormControl>
                            <FormDescription>Parte de la URL que identifica a este cluber.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Categoría del Cluber</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {cluberCategories.map(category => (<SelectItem key={category} value={category}>{category}</SelectItem>))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                        <FormItem><FormLabel>URL del Logo</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                        <FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                />
                
                <h3 className="text-md font-semibold pt-4 border-b pb-2">Permisos del Módulo</h3>

                <FormField
                    control={form.control}
                    name="canCreatePerks"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5"><FormLabel>Crear Beneficios</FormLabel></div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="announcementsEnabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5"><FormLabel>Crear Anuncios</FormLabel></div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="appointmentsEnabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5"><FormLabel>Gestión de Turnos</FormLabel></div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isEditMode ? 'Guardar Cambios' : 'Convertir en Cluber'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
