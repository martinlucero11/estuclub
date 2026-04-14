
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
import { useToast } from '@/hooks/use-toast';
import { MessageSquarePlus, Image as ImageIcon, Link as LinkIcon, Radio } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { collection, serverTimestamp, doc, addDoc } from 'firebase/firestore';
import { useMemo } from 'react';
import { useAdmin } from '@/context/admin-context';

const formSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.').max(100, 'El título no puede exceder los 100 caracteres.'),
  content: z.string().min(10, 'El contenido debe tener al menos 10 caracteres.').max(500, 'El contenido no puede exceder los 500 caracteres.'),
  imageUrl: z.string().url('Por favor, introduce una URL de imagen válida.').optional().or(z.literal('')),
  linkUrl: z.string().url('Por favor, introduce una URL válida.').optional().or(z.literal('')),
  notificationTarget: z.enum(['broadcast', 'followers']).default('followers'),
});

interface UserProfile {
    username: string;
}

export default function AddAnnouncementForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { isAdmin, impersonatedSupplierId, impersonatedSupplierData } = useAdmin();
  const { user, userData, supplierData } = useUser();
  const userProfileRef = useMemo(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const effectiveSupplierId = (isAdmin && impersonatedSupplierId) ? impersonatedSupplierId : user?.uid;
  const merchantName = (isAdmin && impersonatedSupplierId) ? impersonatedSupplierData?.name : supplierData?.name;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      imageUrl: '',
      linkUrl: '',
      notificationTarget: 'followers',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !userProfile) {
        toast({
            variant: "destructive",
            title: "No autenticado",
            description: "Debes iniciar sesión para publicar un anuncio.",
        });
        return;
    }

    try {
      const announcementsRef = collection(firestore, 'announcements');
      const dataToSave: any = {
        authorId: user.uid,
        authorUsername: userProfile.username,
        supplierId: effectiveSupplierId || null,
        merchantName: merchantName || userProfile.username,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      Object.keys(values).forEach(key => {
        const value = (values as any)[key];
        if (value !== undefined) {
          dataToSave[key] = value;
        }
      });

      const announcementDocRef = await addDoc(announcementsRef, dataToSave);

      // Create notification
      if (announcementDocRef) {
          const notificationsRef = collection(firestore, 'notifications');
          const notificationData = {
              title: "Nuevo Anuncio",
              description: `"${values.title}"`,
              type: 'announcement',
              referenceId: announcementDocRef.id,
              createdAt: serverTimestamp(),
          };
          await addDoc(notificationsRef, notificationData);
      }


      toast({
        title: 'Anuncio Publicado',
        description: 'Tu anuncio ya es visible para todos.',
      });
      form.reset();
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo publicar el anuncio. Inténtalo de nuevo.",
      });
    }
  }

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
            <FormItem>
            <FormLabel>Título</FormLabel>
            <FormControl>
                <Input placeholder="Ej: Venta de libros de texto" {...field} />
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
                placeholder="Describe tu anuncio aquí..."
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
                <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
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
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
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

        {/* Audience Selection - Visible only if announcements are enabled */}
        {(supplierData?.announcementsEnabled || userData?.permitsAds) && (
            <FormField
                control={form.control}
                name="notificationTarget"
                render={({ field }) => (
                    <FormItem className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Radio className="h-4 w-4 text-primary" />
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest leading-none">Alcance de la Notificación</FormLabel>
                            </div>
                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter bg-white border-primary/20 text-primary">Premium</Badge>
                        </div>
                        <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="h-12 rounded-xl bg-white border-primary/10 font-bold text-xs uppercase tracking-widest">
                                    <SelectValue placeholder="Seleccionar alcance" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-primary/10">
                                    <SelectItem value="followers" className="text-xs font-bold uppercase tracking-widest focus:bg-primary/5 focus:text-primary">
                                        Solo mis Seguidores
                                    </SelectItem>
                                    <SelectItem value="broadcast" className="text-xs font-bold uppercase tracking-widest focus:bg-primary/5 focus:text-primary">
                                        Toda la Comunidad
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </FormControl>
                        <FormDescription className="text-[9px] font-medium uppercase tracking-tight text-primary/60">
                            {field.value === 'followers' 
                                ? "Llega directo a quienes marcaron tu local como favorito." 
                                : "Visibilidad máxima en toda la red Estuclub."}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        )}
        <Button type="submit">
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Publicar Anuncio
        </Button>
    </form>
    </Form>
  );
}

