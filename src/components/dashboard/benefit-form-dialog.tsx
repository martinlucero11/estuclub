
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { perkCategories } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Globe, Image as ImageIcon, Save, Award, CalendarIcon, Repeat, PlusCircle } from 'lucide-react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, serverTimestamp, Timestamp, addDoc, query } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Checkbox } from '../ui/checkbox';
import { useAdmin } from '@/firebase/auth/use-admin';
import { Switch } from '../ui/switch';

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;
const dayAbbreviations = ["L", "M", "M", "J", "V", "S", "D"];

// Schema now includes ownerId for admins
const formSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  category: z.enum(perkCategories, {
    errorMap: () => ({ message: 'Por favor, selecciona una categoría válida.' }),
  }),
  imageUrl: z.string().url('Por favor, introduce una URL de imagen válida.'),
  location: z.string().min(3, 'La ubicación debe tener al menos 3 caracteres.'),
  points: z.coerce.number().min(0, 'Los puntos deben ser un número positivo.').default(0),
  redemptionLimit: z.coerce.number().min(0, 'El límite debe ser un número positivo.').optional(),
  validUntil: z.date().optional(),
  availableDays: z.array(z.string()).optional(),
  active: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  ownerId: z.string().min(1, 'Debes seleccionar un proveedor.'),
});

interface Supplier {
    id: string;
    name: string;
}

interface BenefitFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BenefitFormDialog({ isOpen, onOpenChange }: BenefitFormDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { isAdmin } = useAdmin();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch suppliers for the admin dropdown
  const suppliersQuery = useMemo(() => query(collection(firestore, 'roles_supplier')), [firestore]);
  const { data: suppliers } = useCollection<Supplier>(suppliersQuery);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      imageUrl: '',
      location: '',
      points: 0,
      redemptionLimit: 0,
      availableDays: [],
      active: true,
      isFeatured: false,
      ownerId: '', // Default to empty, admin must select
    },
  });

  useEffect(() => {
    if (!isAdmin && user) {
        form.setValue('ownerId', user.uid);
    }
  }, [isAdmin, user, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para crear un beneficio.'});
        return;
    }

    setIsSubmitting(true);
    try {
      const benefitsRef = collection(firestore, 'benefits');
      const dataToSave: any = {
        ...values,
        createdAt: serverTimestamp(),
        redemptionCount: 0, // Initialize redemption count
      };
      
      if (values.validUntil) {
          dataToSave.validUntil = Timestamp.fromDate(values.validUntil);
      } else {
        delete dataToSave.validUntil;
      }
       
      if (!values.availableDays || values.availableDays.length === 0) {
        delete dataToSave.availableDays;
      }

      if (!values.redemptionLimit) {
        delete dataToSave.redemptionLimit;
      }

      await addDoc(benefitsRef, dataToSave);

      toast({
        title: '¡Nuevo Beneficio Añadido!',
        description: `El beneficio "${values.title}" ahora está disponible.`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error adding document: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo añadir el beneficio. Inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Beneficio</DialogTitle>
          <DialogDescription>
            Completa el formulario para añadir un nuevo beneficio a la plataforma.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                {isAdmin && (
                    <FormField
                        control={form.control}
                        name="ownerId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Proveedor</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un proveedor" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {suppliers?.map((supplier) => (
                                            <SelectItem key={supplier.id} value={supplier.id}>
                                                {supplier.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>Asigna este beneficio a un proveedor existente.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                 <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Título del Beneficio</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {perkCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                {category}
                                </SelectItem>
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
                            <Textarea
                            className="resize-none"
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
                        <FormLabel>URL de la Imagen</FormLabel>
                        <div className="relative">
                            <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <FormControl>
                            <Input type="url" {...field} className="pl-10" />
                            </FormControl>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Dirección / Ubicación</FormLabel>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <FormControl>
                            <Input {...field} className="pl-10" />
                            </FormControl>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Puntos</FormLabel>
                        <div className="relative">
                            <Award className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <FormControl>
                                <Input type="number" {...field} className="pl-10" />
                            </FormControl>
                        </div>
                         <FormDescription>
                            Puntos que el usuario ganará al canjear este beneficio.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="redemptionLimit"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Límite de Canje por Usuario</FormLabel>
                            <div className="relative">
                                <Repeat className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <FormControl>
                                    <Input type="number" placeholder="0" {...field} className="pl-10" />
                                </FormControl>
                            </div>
                            <FormDescription>
                                0 para ilimitado.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="validUntil"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha de Vencimiento</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP")
                                        ) : (
                                            <span>Elige una fecha</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date < new Date()}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormDescription>
                                    Dejar en blanco para que no expire.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="availableDays"
                    render={() => (
                        <FormItem>
                        <div className="mb-4">
                            <FormLabel className="text-base">Días Disponibles</FormLabel>
                            <FormDescription>
                                Selecciona los días en que este beneficio es válido. Si no seleccionas ninguno, será válido todos los días.
                            </FormDescription>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                        {daysOfWeek.map((day, index) => (
                            <FormField
                            key={day}
                            control={form.control}
                            name="availableDays"
                            render={({ field }) => {
                                return (
                                <FormItem
                                    key={day}
                                    className="flex flex-col items-center space-y-2"
                                >
                                    <FormLabel className="font-normal text-sm">
                                        {dayAbbreviations[index]}
                                    </FormLabel>
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(day)}
                                        onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...(field.value || []), day])
                                            : field.onChange(
                                                field.value?.filter(
                                                (value) => value !== day
                                                )
                                            )
                                        }}
                                    />
                                    </FormControl>
                                </FormItem>
                                )
                            }}
                            />
                        ))}
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                {isAdmin && (
                    <div className='space-y-4'>
                        <FormField
                        control={form.control}
                        name="isFeatured"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Beneficio Destacado</FormLabel>
                                <FormDescription>
                                Marcar para que aparezca en la sección principal del inicio.
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
                        <FormField
                        control={form.control}
                        name="active"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Activo</FormLabel>
                                <FormDescription>
                                Desmarcar para ocultar el beneficio temporalmente.
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
                    </div>
                )}
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={(e) => {e.stopPropagation(); onOpenChange(false);}}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : (
                            <>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Añadir Beneficio
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
