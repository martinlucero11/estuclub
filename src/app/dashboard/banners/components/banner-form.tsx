
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp, addDoc, doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Save, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import type { SerializableBanner } from '@/types/data';

const formSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  imageUrl: z.string().url('Por favor, introduce una URL de imagen válida.'),
  link: z.string().url('Por favor, introduce una URL de enlace válida.').optional().or(z.literal('')),
  colorScheme: z.enum(['pink', 'yellow', 'blue'], {
    errorMap: () => ({ message: 'Por favor, selecciona un color.' }),
  }),
});

interface BannerFormProps {
    banner?: SerializableBanner | null;
    onSuccess: () => void;
}

export function BannerForm({ banner, onSuccess }: BannerFormProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!banner;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: banner?.title || '',
            description: banner?.description || '',
            imageUrl: banner?.imageUrl || '',
            link: banner?.link || '',
            colorScheme: banner?.colorScheme || 'pink',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            if (isEditMode) {
                const bannerRef = doc(firestore, 'banners', banner.id);
                await updateDoc(bannerRef, values);
                toast({ title: 'Banner actualizado', description: 'Los cambios han sido guardados.' });
            } else {
                await addDoc(collection(firestore, 'banners'), {
                    ...values,
                    isActive: true, // Banners are active by default on creation
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Banner creado', description: 'El nuevo banner ha sido añadido.' });
            }
            onSuccess();
        } catch (error: any) {
            console.error("Error saving banner:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo guardar el banner. Inténtalo de nuevo.',
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
                    name="description"
                    render={({ field }) => (
                        <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL de Imagen</FormLabel>
                            <div className="relative"><ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><FormControl><Input type="url" placeholder="https://ejemplo.com/imagen.jpg" {...field} className="pl-10" /></FormControl></div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="link"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL de Destino (Opcional)</FormLabel>
                             <div className="relative"><LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><FormControl><Input type="url" placeholder="https://ejemplo.com/promo" {...field} className="pl-10" /></FormControl></div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="colorScheme"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Color de Fondo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un color" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="pink">Rosa</SelectItem>
                                    <SelectItem value="yellow">Amarillo</SelectItem>
                                    <SelectItem value="blue">Azul</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>Elige un esquema de color para el fondo del banner.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSubmitting ? 'Guardando...' : 'Guardar Banner'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
