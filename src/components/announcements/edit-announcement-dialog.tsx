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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Save, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import type { Announcement } from '@/types/data';

const formSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.').max(100, 'El título no puede exceder los 100 caracteres.'),
  content: z.string().min(10, 'El contenido debe tener al menos 10 caracteres.').max(500, 'El contenido no puede exceder los 500 caracteres.'),
  imageUrl: z.string().url('Por favor, introduce una URL de imagen válida.').optional().or(z.literal('')),
  linkUrl: z.string().url('Por favor, introduce una URL válida.').optional().or(z.literal('')),
});

interface EditAnnouncementDialogProps {
  announcement: Announcement;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditAnnouncementDialog({ announcement, isOpen, onOpenChange }: EditAnnouncementDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: announcement.title,
      content: announcement.content,
      imageUrl: announcement.imageUrl || '',
      linkUrl: announcement.linkUrl || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const announcementRef = doc(firestore, 'announcements', announcement.id);
    try {
      await updateDoc(announcementRef, {
        ...values,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: 'Anuncio Actualizado',
        description: 'El anuncio ha sido modificado con éxito.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating document: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el anuncio. Inténtalo de nuevo.",
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Editar Anuncio</DialogTitle>
          <DialogDescription>
            Modifica el contenido del anuncio.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Contenido</FormLabel>
                    <FormControl>
                        <Textarea
                        className="resize-y"
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>URL de la Imagen (Opcional)</FormLabel>
                        <div className="relative">
                            <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <FormControl>
                            <Input type="url" placeholder="https://ejemplo.com/imagen.jpg" {...field} className="pl-10" />
                            </FormControl>
                        </div>
                        <FormDescription>
                            Pega la URL de una imagen para tu anuncio.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="linkUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL del Enlace (Opcional)</FormLabel>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <FormControl>
                          <Input type="url" placeholder="https://ejemplo.com/mas-info" {...field} className="pl-10" />
                        </FormControl>
                      </div>
                      <FormDescription>
                        Pega un enlace relacionado con tu anuncio.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={(e) => {e.stopPropagation(); onOpenChange(false);}}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar Cambios
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

    