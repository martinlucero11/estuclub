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
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Skeleton } from '../ui/skeleton';
import { SupplierProfile } from '@/types/data';

const formSchema = z.object({
  name: z.string().min(2, 'El nombre del Cluber debe tener al menos 2 caracteres.'),
  description: z.string().optional(),
  logoUrl: z.string().url('URL de logo no válida').optional().or(z.literal('')),
  coverPhotoUrl: z.string().url('URL de foto de portada no válida').optional().or(z.literal('')),
});

function slugify(text: string) {
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return text.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-.]+/g, '') // Remove all non-word chars except dots
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}


export default function EditSupplierProfileForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supplierRef = useMemoFirebase(() => user ? doc(firestore, 'roles_supplier', user.uid) : null, [user, firestore]);
  const { data: supplierProfile, isLoading } = useDoc<SupplierProfile>(supplierRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      logoUrl: '',
      coverPhotoUrl: '',
    },
  });

  useEffect(() => {
    if (supplierProfile) {
        form.reset({
            name: supplierProfile.name,
            description: supplierProfile.description || '',
            logoUrl: supplierProfile.logoUrl || '',
            coverPhotoUrl: supplierProfile.coverPhotoUrl || '',
        });
    }
  }, [supplierProfile, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !supplierRef) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo encontrar tu perfil de Cluber.' });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const newSlug = slugify(values.name);
      
      await updateDoc(supplierRef, {
          name: values.name,
          description: values.description,
          logoUrl: values.logoUrl,
          coverPhotoUrl: values.coverPhotoUrl,
          slug: newSlug, // Update slug in case name changes
      });

      toast({
        title: 'Perfil actualizado',
        description: 'Tu información pública ha sido guardada.',
      });
    } catch (error: any) {
      console.error('Error updating supplier profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar tu perfil.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Público del Cluber</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Café Martínez" {...field} />
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
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe brevemente tu comercio, institución o club..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL del Logo</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://ejemplo.com/logo.png" {...field} />
              </FormControl>
               <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="coverPhotoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de Foto de Portada</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://ejemplo.com/portada.png" {...field} />
              </FormControl>
               <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
          ) : (
              <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>
          )}
        </Button>
      </form>
    </Form>
  );
}
