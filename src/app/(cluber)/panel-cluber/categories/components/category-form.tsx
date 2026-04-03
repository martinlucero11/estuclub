
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
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp, addDoc, doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Save, Palette } from 'lucide-react';
import type { Category } from '@/types/data';

const formSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  emoji: z.string().min(1, 'Debes seleccionar un emoji.').max(4, 'El emoji es demasiado largo.'),
  colorClass: z.string().min(1, 'La clase de color es requerida.'),
  type: z.enum(['perks', 'delivery']).default('perks'),
});

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface CategoryFormProps {
    category?: Category | null;
    onSuccess: () => void;
    defaultType?: 'perks' | 'delivery';
}

export function CategoryForm({ category, onSuccess, defaultType }: CategoryFormProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!category;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: category?.name || '',
            emoji: category?.emoji || '',
            colorClass: category?.colorClass || 'text-primary',
            type: category?.type || defaultType || 'perks',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            if (isEditMode) {
                const categoryRef = doc(firestore, 'categories', category.id);
                await updateDoc(categoryRef, values);
                toast({ title: 'Categoría actualizada', description: 'Los cambios han sido guardados.' });
            } else {
                await addDoc(collection(firestore, 'categories'), {
                    ...values,
                    order: 0,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Categoría creada', description: 'La nueva categoría ha sido añadida.' });
            }
            onSuccess();
        } catch (error: any) {
            console.error("Error saving category:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo guardar la categoría. Inténtalo de nuevo.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Board Destino</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar board" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="perks">Beneficios</SelectItem>
                                        <SelectItem value="delivery">Delivery</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="emoji"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Emoji</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: 🍔" maxLength={4} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="colorClass"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Color (Tailwind)</FormLabel>
                                <div className="relative">
                                    <Palette className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
                                    <FormControl>
                                        <Input placeholder="Ej: text-blue-500" {...field} className="pl-10" />
                                    </FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSubmitting ? 'Guardando...' : 'Guardar Categoría'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

