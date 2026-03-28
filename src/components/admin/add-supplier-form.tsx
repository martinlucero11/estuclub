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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollectionOnce } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useState, useMemo } from 'react';
import { UserPlus } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { cluberCategories, Category } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';

const LocationPicker = dynamic(() => import('@/components/maps/location-picker'), { 
  ssr: false, 
  loading: () => <Skeleton className="w-full h-80 rounded-[2rem]" /> 
});

const formSchema = z.object({
  email: z.string().email('El correo electrónico no es válido.'),
  name: z.string().min(2, 'El nombre del Cluber debe tener al menos 2 caracteres.'),
  type: z.enum(cluberCategories, { required_error: 'Debes seleccionar una categoría.' }),
  description: z.string().optional(),
  logoUrl: z.string().url('URL de logo no válida').optional().or(z.literal('')),
  locationCoords: z.object({ lat: z.number(), lng: z.number() }).optional(),
  deliveryEnabled: z.boolean().default(false),
  deliveryCategory: z.string().optional(),
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

  // Fetch categories from Firestore
  const categoriesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'categories').withConverter(createConverter<Category>()),
      where('type', '==', 'delivery')
    );
  }, [firestore]);
  const { data: dbCategories } = useCollectionOnce(categoriesQuery);
  const deliveryCategories = useMemo(() => {
    if (!dbCategories) return [];
    return dbCategories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(c => c.name);
  }, [dbCategories]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      name: '',
      type: 'Comercio',
      description: '',
      logoUrl: '',
      deliveryEnabled: false,
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
      const dataToSave: any = {
        name: values.name,
        type: values.type,
        email: values.email,
        userId: userId,
        slug: slug,
        description: values.description || '',
        logoUrl: values.logoUrl || '',
        appointmentsEnabled: false, // Default to false
        announcementsEnabled: false,
        deliveryEnabled: values.deliveryEnabled,
        deliveryCategory: values.deliveryCategory || '',
        isFeatured: false,
        createdAt: serverTimestamp(),
      };

      if (values.locationCoords) {
          const { GeoPoint } = await import('firebase/firestore');
          dataToSave.locationCoords = new GeoPoint(values.locationCoords.lat, values.locationCoords.lng);
      }

      const supplierRoleRef = doc(firestore, 'roles_supplier', userId);
      await setDoc(supplierRoleRef, dataToSave);

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
          name="deliveryEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-3xl border border-primary/10 p-4 bg-primary/5">
              <div className="space-y-0.5">
                <FormLabel className="text-base font-bold">Módulo de Delivery</FormLabel>
                <FormDescription className="text-xs font-medium italic opacity-70">
                  Habilita la gestión de productos y recepción de pedidos para este Cluber.
                </FormDescription>
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

        {form.watch('deliveryEnabled') && (
            <FormField
                control={form.control}
                name="deliveryCategory"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-70">Categoría de Delivery</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger className="rounded-xl border-white/10 h-11 bg-white/5">
                                    <SelectValue placeholder="Seleccionar rubro delivery" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {deliveryCategories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        )}
        <FormField
          control={form.control}
          name="locationCoords"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ubicación en el Mapa (Opcional)</FormLabel>
              <div className="text-sm text-muted-foreground mb-4">
                Fija con precisión dónde se encuentra este proveedor para que los alumnos lo descubran en su área.
              </div>
              <div className="h-64 sm:h-80 w-full relative">
                  <LocationPicker 
                      initialLocation={field.value as {lat: number, lng: number} | undefined}
                      onLocationSelect={(loc) => field.onChange(loc)}
                  />
              </div>
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
