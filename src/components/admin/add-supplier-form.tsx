
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { cluberCategories } from '@/types/data';

const formSchema = z.object({
  email: z.string().email('El correo electrónico no es válido.'),
  name: z.string().min(2, 'El nombre del Cluber debe tener al menos 2 caracteres.'),
  type: z.enum(cluberCategories, { required_error: 'Debes seleccionar una categoría.' }),
  description: z.string().optional(),
  logoUrl: z.string().url('URL de logo no válida').optional().or(z.literal('')),
  coverPhotoUrl: z.string().url('URL de portada no válida').optional().or(z.literal('')),
});

function slugify(text: string) {
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return text.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}


export default function AddSupplierForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      name: '',
      type: 'Comercio',
      description: '',
      logoUrl: '',
      coverPhotoUrl: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // 1. Find the user by email
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', values.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'Usuario no encontrado',
          description: `No se encontró ningún usuario con el correo electrónico: ${values.email}`,
        });
        setIsSubmitting(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;
      const slug = slugify(values.name);

      // 2. Add the user to the roles_supplier collection with data
      const supplierRoleRef = doc(firestore, 'roles_supplier', userId);
      await setDoc(supplierRoleRef, {
        name: values.name,
        type: values.type,
        email: values.email,
        userId: userId,
        slug: slug,
        description: values.description || '',
        logoUrl: values.logoUrl || '',
        coverPhotoUrl: values.coverPhotoUrl || '',
        appointmentsEnabled: false, // Default to false
        announcementsEnabled: false,
        isFeatured: false,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Cluber añadido',
        description: `El usuario ${values.email} ahora es un Cluber.`,
      });
      form.reset();
    } catch (error: any) {
      console.error('Error adding supplier:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo añadir el rol de Cluber.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo del Usuario</FormLabel>
              <FormControl>
                <Input placeholder="usuario@email.com" {...field} />
              </FormControl>
               <FormDescription>El correo del usuario al que se le asignará el rol de Cluber.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría del Cluber</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {cluberCategories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
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
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe brevemente al Cluber..." {...field} />
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
              <FormLabel>URL de Foto de Portada (Opcional)</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://ejemplo.com/cover.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Añadiendo...' : <><UserPlus className="mr-2 h-4 w-4" />Añadir Cluber</>}
        </Button>
      </form>
    </Form>
  );
}
