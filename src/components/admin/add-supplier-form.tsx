
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
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { UserPlus, Briefcase, Building, Church, ShoppingBasket, Scale } from 'lucide-react';
import { Textarea } from '../ui/textarea';

const formSchema = z.object({
  email: z.string().email('El correo electrónico no es válido.'),
  name: z.string().min(2, 'El nombre del proveedor debe tener al menos 2 caracteres.'),
  type: z.enum(['Institucion', 'Club', 'Iglesia', 'Comercio', 'Estado']),
  description: z.string().optional(),
  logoUrl: z.string().url('URL de logo no válida').optional().or(z.literal('')),
});

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
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
        email: values.email, // Add email for easier lookup in admin panels
        userId: userId, // Add userId for reference
        slug: slug,
        description: values.description || '',
        logoUrl: values.logoUrl || '',
        allowsBooking: false, // Default to false
      });

      toast({
        title: 'Proveedor añadido',
        description: `El usuario ${values.email} ahora tiene el rol de proveedor.`,
      });
      form.reset();
    } catch (error: any) {
      console.error('Error adding supplier:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo añadir el rol de proveedor.',
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
               <FormDescription>El correo del usuario al que se le asignará el rol.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Público del Proveedor</FormLabel>
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
              <FormLabel>Tipo de Proveedor</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Institucion"><Building className="mr-2 h-4 w-4" />Institución</SelectItem>
                  <SelectItem value="Club"><Briefcase className="mr-2 h-4 w-4" />Club</SelectItem>
                  <SelectItem value="Iglesia"><Church className="mr-2 h-4 w-4" />Iglesia</SelectItem>
                  <SelectItem value="Comercio"><ShoppingBasket className="mr-2 h-4 w-4" />Comercio</SelectItem>
                  <SelectItem value="Estado"><Scale className="mr-2 h-4 w-4" />Estado</SelectItem>
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
                <Textarea placeholder="Describe brevemente al proveedor..." {...field} />
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
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Añadiendo...' : <><UserPlus className="mr-2 h-4 w-4" />Añadir Proveedor</>}
        </Button>
      </form>
    </Form>
  );
}
