
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Plus, Palette } from 'lucide-react';
import type { Category } from '@/types/data';

const categorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  icon: z.string().min(1, 'Agrega un emoji o icono (Ej: 🍔).'),
  type: z.enum(['delivery', 'discount', 'global']).default('global'),
  isActive: z.boolean().default(true),
  order: z.coerce.number().min(0).default(0),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  nextOrder?: number;
}

export function CategoryDialog({ isOpen, onOpenChange, category, nextOrder = 0 }: CategoryDialogProps) {
  const isEditing = !!category;
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      icon: category?.icon || '',
      type: category?.type || 'global',
      isActive: category?.isActive ?? true,
      order: category?.order ?? nextOrder,
    },
  });

  // Handle resets
  useState(() => {
    if (isOpen) {
        form.reset({
            name: category?.name || '',
            icon: category?.icon || '',
            type: category?.type || 'global',
            isActive: category?.isActive ?? true,
            order: category?.order ?? nextOrder,
        });
    }
  });

  const onSubmit = async (values: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing && category) {
        const categoryRef = doc(firestore, 'categories', category.id);
        await updateDoc(categoryRef, {
          ...values,
          updatedAt: serverTimestamp(),
        });
        toast({ title: 'Categoría actualizada', description: `Se guardaron los cambios en ${values.name}.` });
      } else {
        const categoriesRef = collection(firestore, 'categories');
        await addDoc(categoriesRef, {
          ...values,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Categoría creada', description: `La categoría ${values.name} está lista.` });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving category:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'No se pudo guardar la categoría. Inténtalo de nuevo.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-white/10 shadow-3xl bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase font-montserrat">
            {isEditing ? 'Editar' : 'Nueva'} <span className="text-primary italic">Categoría</span>
          </DialogTitle>
          <DialogDescription className="text-[10px] font-black uppercase tracking-widest opacity-40">
            {isEditing ? 'Modifica la identidad de la categoría.' : 'Configura un nuevo nodo de navegación para la app.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <div className="grid grid-cols-4 gap-4">
                <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                        <FormItem className="col-span-1">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Icono</FormLabel>
                        <FormControl>
                            <Input placeholder="🍔" {...field} className="h-14 text-center text-2xl rounded-2xl bg-background/50 border-white/5 focus:border-primary/40 font-bold" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="col-span-3">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Nombre</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Pizza" {...field} className="h-14 rounded-2xl bg-background/50 border-white/5 focus:border-primary/40 font-bold" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Tipo de Filtro</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/40 font-bold">
                        <SelectValue placeholder="Selecciona el destino" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="global" className="font-bold">Global (Todos)</SelectItem>
                      <SelectItem value="delivery" className="font-bold text-blue-400">Delivery Only</SelectItem>
                      <SelectItem value="discount" className="font-bold text-primary">Benefits Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-[8px] font-bold uppercase tracking-widest opacity-30">Determina en qué board aparecerá la categoría.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4 h-24">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Activada</span>
                    </div>
                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-primary"
                            />
                            </FormControl>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <div className="h-full flex flex-col justify-center bg-white/5 border border-white/5 rounded-2xl px-4">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40 mb-1">Orden Visual</span>
                                    <Input type="number" {...field} className="h-8 p-0 bg-transparent border-none text-xl font-bold font-mono focus-visible:ring-0" />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <DialogFooter className="pt-6">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest opacity-40">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl h-14 px-10 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-primary/90 transition-all flex items-center gap-3">
                {isSubmitting ? 'Procesando...' : (
                    <>
                        <Save className="h-5 w-5" />
                        {isEditing ? 'Actualizar' : 'Crear Nodo'}
                    </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
