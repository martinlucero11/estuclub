
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
import { benefitCategories, type SerializableBenefit } from '@/types/data';
import { useToast } from '@/hooks/use-toast';
import { Globe, Image as ImageIcon, Save, Award, CalendarIcon, Repeat } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Checkbox } from '../ui/checkbox';
import { useAdmin } from '@/firebase/auth/use-admin';
import { Switch } from '../ui/switch';

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;
const dayAbbreviations = ["L", "M", "M", "J", "V", "S", "D"];

const formSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  category: z.enum(benefitCategories, {
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
});

interface EditBenefitDialogProps {
  benefit: SerializableBenefit;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditBenefitDialog({ benefit, isOpen, onOpenChange }: EditBenefitDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { isAdmin } = useAdmin();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: benefit.title,
      description: benefit.description,
      category: benefit.category,
      imageUrl: benefit.imageUrl,
      location: benefit.location,
      points: benefit.points || 0,
      redemptionLimit: benefit.redemptionLimit || 0,
      validUntil: benefit.validUntil ? new Date(benefit.validUntil) : undefined,
      availableDays: benefit.availableDays || [],
      active: benefit.active ?? true,
      isFeatured: benefit.isFeatured ?? false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const benefitRef = doc(firestore, 'benefits', benefit.id);
    try {
        const dataToUpdate: any = { ...values };
        
        if (values.validUntil) {
            dataToUpdate.validUntil = Timestamp.fromDate(values.validUntil);
        } else {
            // Firestore does not allow `undefined`, so we delete the key.
            delete dataToUpdate.validUntil;
        }

        if (!values.redemptionLimit) {
          delete dataToUpdate.redemptionLimit;
        }
        if (!values.availableDays || values.availableDays.length === 0) {
            delete dataToUpdate.availableDays;
        }

      await updateDoc(benefitRef, dataToUpdate);
      toast({
        title: 'Beneficio Actualizado',
        description: `El beneficio "${values.title}" ha sido actualizado.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating document: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el beneficio. Inténtalo de nuevo.",
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
                <DialogTitle>Editar Beneficio</DialogTitle>
                <DialogDescription>
                    Realiza cambios en este beneficio. Haz clic en guardar cuando hayas terminado.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
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
                        {benefitCategories.map((category) => (
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
                                Veces que un usuario puede canjear esto. 0 para ilimitado.
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
                                    El beneficio no se podrá canjear después de esta fecha. Déjalo en blanco para que no expire.
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
