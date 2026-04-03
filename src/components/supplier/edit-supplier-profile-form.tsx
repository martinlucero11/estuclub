
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
import { doc, updateDoc, GeoPoint } from 'firebase/firestore';
import { useEffect, useState, useRef, useMemo } from 'react';
import { Save, Loader2, Camera, Truck, Clock, MapPin } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Skeleton } from '../ui/skeleton';
import { SupplierProfile, cluberCategories, deliveryCategories } from '@/types/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/maps/location-picker'), { 
  ssr: false, 
  loading: () => <Skeleton className="w-full h-80 rounded-[2rem]" /> 
});


const formSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  description: z.string().optional(),
  type: z.enum(cluberCategories, { required_error: 'Debes seleccionar una categoría.' }),
  address: z.string().optional(),
  whatsapp: z.string().optional(),
  logoUrl: z.string().url('URL de logo no válida').optional().or(z.literal('')),
  locationCoords: z.object({ lat: z.number(), lng: z.number() }).optional(),
  deliveryEnabled: z.boolean().default(false),
  deliveryCost: z.number().optional(),
  deliveryCostType: z.enum(['free', 'customer', 'to_be_agreed']).default('free'),
  minOrderAmount: z.number().optional(),
  deliveryCategory: z.string().optional(),
  coverUrl: z.string().url('URL de imagen de portada no válida').optional().or(z.literal('')),
  operatingHours: z.record(z.object({
    active: z.boolean(),
    startTime: z.string(),
    endTime: z.string()
  })).optional(),
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

  // States and refs for COVER upload
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

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
      deliveryEnabled: false,
      deliveryCost: 0,
      deliveryCostType: 'free',
      minOrderAmount: 0,
      deliveryCategory: '',
      coverUrl: '',
      operatingHours: {
        monday: { active: true, startTime: '09:00', endTime: '18:00' },
        tuesday: { active: true, startTime: '09:00', endTime: '18:00' },
        wednesday: { active: true, startTime: '09:00', endTime: '18:00' },
        thursday: { active: true, startTime: '09:00', endTime: '18:00' },
        friday: { active: true, startTime: '09:00', endTime: '18:00' },
        saturday: { active: false, startTime: '09:00', endTime: '18:00' },
        sunday: { active: false, startTime: '09:00', endTime: '18:00' },
      }
    },
  });

  const logoUrlFromForm = form.watch('logoUrl');

  useEffect(() => {
    if (supplierProfile) {
        form.reset({
            name: supplierProfile.name,
            description: supplierProfile.description || '',
            type: supplierProfile.type,
            address: supplierProfile.address || '',
            whatsapp: supplierProfile.whatsapp || '',
            logoUrl: supplierProfile.logoUrl || '',
            locationCoords: supplierProfile.locationCoords 
               ? { lat: supplierProfile.locationCoords.latitude, lng: supplierProfile.locationCoords.longitude } 
               : undefined,
            deliveryEnabled: supplierProfile.deliveryEnabled || false,
            deliveryCost: supplierProfile.deliveryCost || 0,
            deliveryCostType: supplierProfile.deliveryCostType || 'free',
            minOrderAmount: supplierProfile.minOrderAmount || 0,
            deliveryCategory: supplierProfile.deliveryCategory || '',
            coverUrl: supplierProfile.coverUrl || '',
            operatingHours: supplierProfile.operatingHours?.schedule || {
              monday: { active: true, startTime: '09:00', endTime: '18:00' },
              tuesday: { active: true, startTime: '09:00', endTime: '18:00' },
              wednesday: { active: true, startTime: '09:00', endTime: '18:00' },
              thursday: { active: true, startTime: '09:00', endTime: '18:00' },
              friday: { active: true, startTime: '09:00', endTime: '18:00' },
              saturday: { active: false, startTime: '09:00', endTime: '18:00' },
              sunday: { active: false, startTime: '09:00', endTime: '18:00' },
            },
        });
    }
  }, [supplierProfile, form]);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    path: 'logo' | 'cover',
    setUploading: (isUploading: boolean) => void,
    setPreview: (url: string | null) => void,
    fieldName: 'logoUrl' | 'coverUrl'
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
      
      // Filter out undefined values to prevent Firestore errors
      const dataToSave: any = {};
      Object.keys(values).forEach(key => {
        const value = (values as any)[key];
        if (value !== undefined) {
          dataToSave[key] = value;
        }
      });

      if (values.locationCoords) {
          dataToSave.locationCoords = new GeoPoint(values.locationCoords.lat, values.locationCoords.lng);
      }

      if (values.operatingHours) {
          dataToSave.operatingHours = { schedule: values.operatingHours };
      }

      await updateDoc(supplierRef, {
          ...dataToSave,
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
                    <AvatarImage src={logoPreview || logoUrlFromForm || ''} alt="Logo" className="object-cover" />
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

        <FormItem className="flex flex-col items-center">
            <FormLabel>Imagen de Portada (Delivery Card)</FormLabel>
            <div className="relative w-full aspect-[16/10] max-w-md overflow-hidden rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-background/50 transition-all hover:border-primary/40 group">
                {(isUploadingCover) && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                        <Loader2 className="h-10 w-10 text-white animate-spin" />
                    </div>
                )}
                {coverPreview || form.watch('coverUrl') ? (
                    <img 
                        src={coverPreview || form.watch('coverUrl') || ''} 
                        alt="Portada" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-foreground gap-2">
                        <Camera className="h-12 w-12 opacity-20" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-50">Vista previa de tarjeta</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={() => coverInputRef.current?.click()} 
                        disabled={isUploadingCover}
                        className="rounded-full font-black uppercase tracking-widest text-[10px]"
                    >
                        Cambiar Imagen
                    </Button>
                </div>
            </div>
            <Input 
                type="file" 
                className="hidden"
                ref={coverInputRef}
                onChange={(e) => handleImageUpload(e, 'cover', setIsUploadingCover, setCoverPreview, 'coverUrl')}
                accept="image/png, image/jpeg, image/webp"
                disabled={isUploadingCover}
            />
            <p className="text-[10px] text-foreground italic text-center max-w-sm mt-2">
                Esta es la imagen de "fondo" que se verá cuando los alumnos busquen tu local en la sección de Delivery. Recomendamos formato 16:10.
            </p>
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
          name="locationCoords"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ubicación en el Mapa</FormLabel>
              <div className="text-sm text-foreground mb-4">
                Ubica el pin en el lugar exacto de tu local para atraer a los alumnos de la universidad y aparecer en el mapa geolocalizado.
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
        
        <div className="space-y-6 pt-6 border-t border-foreground/50">
            <h3 className="text-lg font-black uppercase tracking-widest text-[#cb465a] flex items-center gap-2">
                <Clock className="h-5 w-5" /> Horarios de Atención
            </h3>
            <div className="grid gap-4">
                {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => (
                    <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-background/30 border border-foreground/50">
                        <div className="flex items-center gap-4 min-w-[120px]">
                            <Switch 
                                checked={form.watch(`operatingHours.${day}.active`)} 
                                onCheckedChange={(val) => form.setValue(`operatingHours.${day}.active`, val, { shouldDirty: true })}
                            />
                            <span className="font-black uppercase tracking-widest text-xs">
                                {day === 'monday' ? 'Lunes' : 
                                 day === 'tuesday' ? 'Martes' : 
                                 day === 'wednesday' ? 'Miércoles' : 
                                 day === 'thursday' ? 'Jueves' : 
                                 day === 'friday' ? 'Viernes' : 
                                 day === 'saturday' ? 'Sábado' : 'Domingo'}
                            </span>
                        </div>

                        <div className={cn(
                            "flex items-center gap-3 transition-opacity duration-300",
                            !form.watch(`operatingHours.${day}.active`) && "opacity-20 pointer-events-none"
                        )}>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold opacity-40 uppercase">Desde</span>
                                <Input 
                                    type="time" 
                                    className="h-10 w-32 rounded-xl bg-white/50 dark:bg-black/50"
                                    {...form.register(`operatingHours.${day}.startTime`)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold opacity-40 uppercase">Hasta</span>
                                <Input 
                                    type="time" 
                                    className="h-10 w-32 rounded-xl bg-white/50 dark:bg-black/50"
                                    {...form.register(`operatingHours.${day}.endTime`)}
                                />
                            </div>
                        </div>

                        {!form.watch(`operatingHours.${day}.active`) && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Cerrado</span>
                        )}
                    </div>
                ))}
            </div>
            <p className="text-[10px] text-foreground italic pl-2">Define tus horarios para que los alumnos sepan cuándo pueden visitarte o pedir delivery.</p>
        </div>
        
         <div className="space-y-4 pt-6 border-t border-foreground/50">
            <h3 className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Truck className="h-5 w-5" /> Configuración de Delivery
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="deliveryEnabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-2xl border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Habilitar Delivery</FormLabel>
                                <div className="text-sm text-foreground">Activa esta opción para recibir pedidos online.</div>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                
                <FormField
                    control={form.control}
                    name="deliveryCategory"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sub-categoría de Delivery</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona una sub-categoría" />
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

                <FormField
                    control={form.control}
                    name="deliveryCostType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Costo de Envío</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona el tipo de costo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="free">Gratis</SelectItem>
                                    <SelectItem value="customer">A cargo del Cliente (Fijo)</SelectItem>
                                    <SelectItem value="to_be_agreed">A convenir</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {form.watch('deliveryCostType') === 'customer' && (
                    <FormField
                        control={form.control}
                        name="deliveryCost"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Costo de Envío ($)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        placeholder="500" 
                                        {...field} 
                                        onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="minOrderAmount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Pedido Mínimo ($)</FormLabel>
                            <FormControl>
                                <Input 
                                    type="number" 
                                    placeholder="0" 
                                    {...field}
                                    onChange={e => field.onChange(Number(e.target.value))}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
         </div>

        <Button type="submit" disabled={isSubmitting || isUploadingLogo} className="w-full sm:w-auto h-12 px-8 text-lg font-black rounded-2xl shadow-lg shadow-primary/20">
          {isSubmitting ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Guardando...</>
          ) : (
              <><Save className="mr-2 h-5 w-5" /> Guardar Cambios</>
          )}
        </Button>
      </form>
    </Form>
  );
}

