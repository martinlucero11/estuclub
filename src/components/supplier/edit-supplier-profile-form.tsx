
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
import { useFirestore, useUser, useDoc, useStorage } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState, useRef, useMemo } from 'react';
import { Save, Loader2, Camera } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Skeleton } from '../ui/skeleton';
import { SupplierProfile, cluberCategories } from '@/types/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Image from 'next/image';


const formSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  description: z.string().optional(),
  type: z.enum(cluberCategories, { required_error: 'Debes seleccionar una categoría.' }),
  address: z.string().optional(),
  whatsapp: z.string().optional(),
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
  const storage = useStorage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // States and refs for LOGO upload
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // States and refs for COVER PHOTO upload
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);

  const supplierRef = useMemo(() => user ? doc(firestore, 'roles_supplier', user.uid) : null, [user, firestore]);
  const { data: supplierProfile, isLoading } = useDoc<SupplierProfile>(supplierRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'Comercio',
      address: '',
      whatsapp: '',
      logoUrl: '',
      coverPhotoUrl: '',
    },
  });

  const logoUrlFromForm = form.watch('logoUrl');
  const coverPhotoUrlFromForm = form.watch('coverPhotoUrl');

  useEffect(() => {
    if (supplierProfile) {
        form.reset({
            name: supplierProfile.name,
            description: supplierProfile.description || '',
            type: supplierProfile.type,
            address: supplierProfile.address || '',
            whatsapp: supplierProfile.whatsapp || '',
            logoUrl: supplierProfile.logoUrl || '',
            coverPhotoUrl: supplierProfile.coverPhotoUrl || '',
        });
    }
  }, [supplierProfile, form]);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    path: 'logo' | 'coverPhoto',
    setUploading: (isUploading: boolean) => void,
    setPreview: (url: string | null) => void,
    fieldName: 'logoUrl' | 'coverPhotoUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Archivo inválido', description: 'Por favor, selecciona una imagen.' });
        return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ variant: 'destructive', title: 'Archivo muy grande', description: 'La imagen no puede pesar más de 5MB.' });
        return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
        const imageStorageRef = storageRef(storage, `suppliers/${user.uid}/${path}-${Date.now()}`);
        await uploadBytes(imageStorageRef, file);
        const downloadURL = await getDownloadURL(imageStorageRef);
        
        form.setValue(fieldName, downloadURL, { shouldValidate: true, shouldDirty: true });
        setPreview(null);
        URL.revokeObjectURL(localUrl);
        toast({ title: 'Imagen subida', description: 'El cambio se guardará al actualizar tu perfil.'});

    } catch (error) {
        console.error(`Error uploading ${path}:`, error);
        toast({ variant: 'destructive', title: 'Error de subida', description: `No se pudo subir la imagen.` });
        setPreview(null);
        URL.revokeObjectURL(localUrl);
    } finally {
        setUploading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !supplierRef) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo encontrar tu perfil de Cluber.' });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const newSlug = slugify(values.name);
      
      await updateDoc(supplierRef, {
          ...values,
          slug: newSlug,
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
            <div className="flex justify-center">
                 <Skeleton className="h-32 w-32 rounded-full" />
            </div>
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            <Skeleton className="h-10 w-32" />
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <FormItem className="flex flex-col items-center">
            <FormLabel>Logo del Cluber</FormLabel>
            <div className="relative h-32 w-32">
                {(isUploadingLogo) && (
                    <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center z-10">
                        <Loader2 className="h-10 w-10 text-white animate-spin" />
                    </div>
                )}
                <Avatar className="h-32 w-32">
                    <AvatarImage src={logoPreview || logoUrlFromForm || ''} alt="Logo" className="object-contain" />
                    <AvatarFallback className="text-4xl">
                        {supplierProfile?.name.charAt(0).toUpperCase() || 'S'}
                    </AvatarFallback>
                </Avatar>
            </div>
            <Input 
                type="file" 
                className="hidden"
                ref={logoInputRef}
                onChange={(e) => handleImageUpload(e, 'logo', setIsUploadingLogo, setLogoPreview, 'logoUrl')}
                accept="image/png, image/jpeg, image/webp"
                disabled={isUploadingLogo}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={isUploadingLogo}>
                <Camera className="mr-2 h-4 w-4" />
                Subir Logo
            </Button>
        </FormItem>
        
        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL del Logo</FormLabel>
              <FormControl>
                <Input type="url" placeholder="Sube una imagen o pega una URL aquí" {...field} />
              </FormControl>
               <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Público</FormLabel>
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
              <FormLabel>Descripción / Bio</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe brevemente tu comercio, institución o club..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Av. Siempreviva 742" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="whatsapp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de WhatsApp (con cód. de país)</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+54911..." {...field} />
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
                <div className="flex items-center justify-between">
                    <FormLabel>Foto de Portada</FormLabel>
                    <Button type="button" variant="outline" size="sm" onClick={() => coverPhotoInputRef.current?.click()} disabled={isUploadingCover}>
                        {isUploadingCover ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                        Subir Portada
                    </Button>
                </div>
                <div className="relative aspect-video w-full mt-2 rounded-md overflow-hidden border">
                     {(isUploadingCover) && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                            <Loader2 className="h-10 w-10 text-white animate-spin" />
                        </div>
                    )}
                    <Image src={coverPreview || coverPhotoUrlFromForm || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg=="} alt="Vista previa de portada" fill className="object-cover"/>
                </div>
              <FormControl>
                <Input type="url" placeholder="Pega una URL o sube una imagen" {...field} />
              </FormControl>
              <Input
                type="file"
                className="hidden"
                ref={coverPhotoInputRef}
                onChange={(e) => handleImageUpload(e, 'coverPhoto', setIsUploadingCover, setCoverPreview, 'coverPhotoUrl')}
                accept="image/png, image/jpeg, image/webp"
                disabled={isUploadingCover}
               />
               <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting || isUploadingLogo || isUploadingCover} className="w-full sm:w-auto">
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
