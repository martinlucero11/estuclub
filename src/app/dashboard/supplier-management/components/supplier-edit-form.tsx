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
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { SupplierProfile, cluberCategories } from '@/types/data';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  type: z.enum(cluberCategories, { required_error: 'Debes seleccionar una categoría.' }),
  description: z.string().optional(),
  logoUrl: z.string().url('URL de logo no válida').optional().or(z.literal('')),
  address: z.string().optional(),
  whatsapp: z.string().optional(),
  appointmentsEnabled: z.boolean().default(false),
  announcementsEnabled: z.boolean().default(false),
  canCreatebenefits: z.boolean().default(false),
});

interface SupplierEditFormProps {
    supplier: SupplierProfile;
    onSuccess: () => void;
}


export function SupplierEditForm({ supplier, onSuccess }: SupplierEditFormProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: supplier?.name || '',
            type: supplier?.type || 'Comercio',
            description: supplier?.description || '',
            logoUrl: supplier?.logoUrl || '',
            address: supplier?.address || '',
            whatsapp: supplier?.whatsapp || '',
            appointmentsEnabled: supplier?.appointmentsEnabled || false,
            announcementsEnabled: supplier?.announcementsEnabled || false,
            canCreatebenefits: supplier?.canCreatebenefits || true,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const supplierDocRef = doc(firestore, 'roles_supplier', supplier.id);
            // We only update fields managed by the admin in this form, plus profile data.
            // isVisible and isFeatured are managed by toggles outside.
            const dataToSave = {
                ...values,
            };
            
            await updateDoc(supplierDocRef, dataToSave);

            toast({
                title: 'Cluber Actualizado',
                description: `El perfil de ${supplier.name} ha sido actualizado.`,
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
                                <Input {...field} placeholder="Ej: Café Martínez"/>
                            </FormControl>
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
                    name="canCreatebenefits"
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
                        Guardar Cambios
                    </Button>
                </div>
            </form>
        </Form>
    );
}
