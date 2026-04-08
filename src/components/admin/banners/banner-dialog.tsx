
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image as ImageIcon, Link as LinkIcon, Save, Plus } from 'lucide-react';
import type { Announcement } from '@/types/data';

const bannerSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
  description: z.string().min(5, 'La descripción debe tener al menos 5 caracteres.'),
  imageUrl: z.string().url('Por favor, ingresa una URL de imagen válida.'),
  link: z.string().optional(),
  colorScheme: z.enum(['pink', 'yellow', 'blue']).default('pink'),
  isActive: z.boolean().default(true),
});

type AnnouncementFormValues = z.infer<typeof bannerSchema>;

interface AnnouncementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: Announcement | null;
}

export function AnnouncementDialog({ isOpen, onOpenChange, banner }: AnnouncementDialogProps) {
  const isEditing = !!banner;
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: banner?.title || '',
      description: banner?.description || '',
      imageUrl: banner?.imageUrl || '',
      link: banner?.link || '',
      colorScheme: banner?.colorScheme || 'pink',
      isActive: banner?.isActive ?? true,
    },
  });

  // Reset form when banner changes or dialog opens
  useState(() => {
    if (isOpen) {
        form.reset({
            title: banner?.title || '',
            description: banner?.description || '',
            imageUrl: banner?.imageUrl || '',
            link: banner?.link || '',
            colorScheme: banner?.colorScheme || 'pink',
            isActive: banner?.isActive ?? true,
        });
    }
  });

  const onSubmit = async (values: AnnouncementFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing && banner) {
        const bannerRef = doc(firestore, 'announcements', banner.id);
        await updateDoc(bannerRef, {
          ...values,
          updatedAt: serverTimestamp(),
        });
        toast({ title: 'Announcement actualizado', description: 'Los cambios se han guardado.' });
      } else {
        const bannersRef = collection(firestore, 'announcements');
        await addDoc(bannersRef, {
          ...values,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Announcement creado', description: 'El nuevo banner está listo.' });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving banner:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'No se pudo guardar el banner. Inténtalo de nuevo.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-white/10 shadow-3xl bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase font-montserrat">
            {isEditing ? 'Editar' : 'Nuevo'} <span className="text-primary italic">Announcement</span>
          </DialogTitle>
          <DialogDescription className="text-[10px] font-black uppercase tracking-widest opacity-40">
            {isEditing ? 'Modifica los detalles del elemento visual.' : 'Configura una nueva pieza publicitaria para el home.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Promo de Verano" {...field} className="h-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/40 font-bold" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                        placeholder="Escribe el texto secundario del banner..." 
                        {...field} 
                        className="min-h-[80px] rounded-xl bg-background/50 border-white/5 focus:border-primary/40 font-bold text-xs" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">URL Imagen</FormLabel>
                    <div className="relative">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20" />
                        <FormControl>
                            <Input placeholder="https://..." {...field} className="h-12 pl-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/40 text-xs" />
                        </FormControl>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Link (Opcional)</FormLabel>
                    <div className="relative">
                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20" />
                        <FormControl>
                            <Input placeholder="/delivery/..." {...field} className="h-12 pl-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/40 text-xs" />
                        </FormControl>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-primary/5 transition-all">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Estado Activo</span>
                    <span className="text-[8px] font-bold text-foreground/30 uppercase tracking-widest">¿Mostrar este banner ahora mismo?</span>
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

            <DialogFooter className="pt-6">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest opacity-40">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl h-12 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary/90 transition-all flex items-center gap-2">
                {isSubmitting ? 'Guardando...' : (
                    <>
                        {isEditing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {isEditing ? 'Guardar Cambios' : 'Crear Announcement'}
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
