
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp, addDoc, doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Save, SortAsc, CaseSensitive } from 'lucide-react';
import type { HomeSection } from '@/lib/data';
import { homeSectionTypes } from '@/lib/data';
import { Switch } from '@/components/ui/switch';


const formSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
  type: z.enum(homeSectionTypes, {
    errorMap: () => ({ message: 'Por favor, selecciona un tipo de sección válido.' }),
  }),
  order: z.coerce.number().min(0, 'El orden debe ser un número positivo.'),
  isActive: z.boolean().default(true),
});

interface HomeSectionFormProps {
    section?: HomeSection | null;
    onSuccess: () => void;
}

export function HomeSectionForm({ section, onSuccess }: HomeSectionFormProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!section;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: section?.title || '',
            type: section?.type || 'featured_perks',
            order: section?.order || 0,
            isActive: section?.isActive ?? true,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            if (isEditMode && section) {
                const sectionRef = doc(firestore, 'home_sections', section.id);
                await updateDoc(sectionRef, values);
                toast({ title: 'Sección actualizada', description: 'Los cambios han sido guardados.' });
            } else {
                await addDoc(collection(firestore, 'home_sections'), {
                    ...values,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Sección creada', description: 'La nueva sección ha sido añadida a la Home.' });
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
                        <FormItem>
                            <FormLabel>Título de la Sección</FormLabel>
                             <div className="relative"><CaseSensitive className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><FormControl><Input {...field} className="pl-10" /></FormControl></div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Contenido</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {homeSectionTypes.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Orden de Aparición</FormLabel>
                             <div className="relative"><SortAsc className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><FormControl><Input type="number" {...field} className="pl-10" /></FormControl></div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Activa</FormLabel>
                            </div>
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
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
