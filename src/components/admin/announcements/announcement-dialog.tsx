
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useCollection } from '@/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp, query } from 'firebase/firestore';
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
import { Image as ImageIcon, Link as LinkIcon, Save, Megaphone, Users, CheckCircle2, XCircle } from 'lucide-react';
import type { Announcement } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';

const announcementSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  content: z.string().min(10, 'El contenido debe tener al menos 10 caracteres.'),
  imageUrl: z.string().url('URL de imagen inválida.').optional().or(z.literal('')),
  linkUrl: z.string().optional().or(z.literal('')),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  isVisible: z.boolean().default(true),
  isStudentOnly: z.boolean().default(false),
  isCincoDosOnly: z.boolean().default(false),
  minLevel: z.coerce.number().min(1).max(10).default(1),
  ownerId: z.string().optional(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

interface AnnouncementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  announcement?: Announcement | null;
}

export function AnnouncementDialog({ isOpen, onOpenChange, announcement }: AnnouncementDialogProps) {
  const isEditing = !!announcement;
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch suppliers for admin selection
  const suppliersQuery = useMemo(() => 
    query(collection(firestore, 'roles_supplier').withConverter(createConverter<{ id: string, name: string }>())), 
  [firestore]);
  const { data: suppliers } = useCollection(suppliersQuery);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: announcement?.title || '',
      content: announcement?.content || '',
      imageUrl: announcement?.imageUrl || '',
      linkUrl: announcement?.linkUrl || '',
      status: announcement?.status || 'pending',
      isVisible: announcement?.isVisible ?? true,
      isStudentOnly: announcement?.isStudentOnly ?? false,
      isCincoDosOnly: announcement?.isCincoDosOnly ?? false,
      minLevel: announcement?.minLevel ?? 1,
      ownerId: announcement?.supplierId || '',
    },
  });

  useEffect(() => {
    if (isOpen) {
        form.reset({
            title: announcement?.title || '',
            content: announcement?.content || '',
            imageUrl: announcement?.imageUrl || '',
            linkUrl: announcement?.linkUrl || '',
            status: announcement?.status || 'pending',
            isVisible: announcement?.isVisible ?? true,
            isStudentOnly: announcement?.isStudentOnly ?? false,
            isCincoDosOnly: announcement?.isCincoDosOnly ?? false,
            minLevel: announcement?.minLevel ?? 1,
            ownerId: announcement?.supplierId || '',
        });
    }
  }, [announcement, isOpen, form]);

  const onSubmit = async (values: AnnouncementFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing && announcement) {
        const announcementRef = doc(firestore, 'announcements', announcement.id);
        await updateDoc(announcementRef, {
          ...values,
          updatedAt: serverTimestamp(),
        });
        toast({ title: 'Anuncio actualizado', description: 'Los cambios han sido guardados.' });
      } else {
        const announcementsRef = collection(firestore, 'announcements');
        const supplier = suppliers?.find(s => s.id === values.ownerId);
        await addDoc(announcementsRef, {
          ...values,
          supplierId: values.ownerId,
          authorUsername: supplier?.name || 'Admin',
          submittedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Anuncio creado', description: 'El anuncio ha sido publicado.' });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el anuncio.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] border-white/10 shadow-3xl bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase font-montserrat">
            {isEditing ? 'Gestionar' : 'Nuevo'} <span className="text-primary italic">Anuncio</span>
          </DialogTitle>
          <DialogDescription className="text-[10px] font-black uppercase tracking-widest opacity-40">
            {isEditing ? 'Revisa el contenido y aprueba o rechaza la publicación.' : 'Crea una comunicación masiva para los usuarios.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 max-h-[65vh] overflow-y-auto px-1 custom-scrollbar">
            <FormField
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Proveedor / Autor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-xl bg-background border-white/5 font-bold">
                        <SelectValue placeholder="Selecciona el emisor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers?.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: ¡Nuevo Local Abierto!" {...field} className="h-12 rounded-xl bg-background border-white/5 font-bold" />
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
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Mensaje Principal</FormLabel>
                  <FormControl>
                    <Textarea 
                        placeholder="Escribe el cuerpo del anuncio..." 
                        {...field} 
                        className="min-h-[120px] rounded-xl bg-background border-white/5 focus:border-primary/40 text-sm leading-relaxed" 
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
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Imagen URL</FormLabel>
                    <div className="relative">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20" />
                        <FormControl>
                            <Input placeholder="https://..." {...field} className="h-12 pl-12 rounded-xl bg-background border-white/5 text-xs" />
                        </FormControl>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="linkUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Acción / Link</FormLabel>
                    <div className="relative">
                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20" />
                        <FormControl>
                            <Input placeholder="/suppliers/..." {...field} className="h-12 pl-12 rounded-xl bg-background border-white/5 text-xs" />
                        </FormControl>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Targeting Social</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-white/5">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Estudiantes</span>
                        <FormField
                            control={form.control}
                            name="isStudentOnly"
                            render={({ field }) => (
                                <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            )}
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-white/5">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Cinco.Dos</span>
                        <FormField
                            control={form.control}
                            name="isCincoDosOnly"
                            render={({ field }) => (
                                <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            )}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Estado Moderación</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                            <SelectTrigger className="h-12 rounded-xl bg-background border-white/5 font-bold">
                                <SelectValue />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="approved">Aprobado</SelectItem>
                                <SelectItem value="rejected">Rechazado</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 h-[72px] mt-auto">
                    <span className="text-[10px] font-black uppercase tracking-widest">¿Visible?</span>
                    <FormField
                        control={form.control}
                        name="isVisible"
                        render={({ field }) => (
                            <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-primary" />
                            </FormControl>
                        )}
                    />
                </div>
            </div>

            <DialogFooter className="pt-6 sticky bottom-0 bg-card/95 py-4 border-t border-white/5">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest opacity-40">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl h-12 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary/90 transition-all flex items-center gap-2">
                {isSubmitting ? 'Guardando...' : (
                    <>
                        <Save className="h-4 w-4" />
                        {isEditing ? 'Confirmar Cambios' : 'Publicar Anuncio'}
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
