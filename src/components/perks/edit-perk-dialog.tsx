
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
import { perkCategories, type Perk } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Globe, Image as ImageIcon, Save, Award, CalendarIcon, Repeat } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Checkbox } from '../ui/checkbox';

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;

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
});

interface EditPerkDialogProps {
  perk: Perk;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditPerkDialog({ perk, isOpen, onOpenChange }: EditPerkDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: perk.title,
      description: perk.description,
      category: perk.category,
      imageUrl: perk.imageUrl,
      location: perk.location,
      points: perk.points || 0,
      redemptionLimit: perk.redemptionLimit || 0,
      validUntil: perk.validUntil ? perk.validUntil.toDate() : undefined,
      availableDays: perk.availableDays || [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const perkRef = doc(firestore, 'benefits', perk.id);
    try {
        const dataToUpdate: any = { ...values };
        if (values.validUntil) {
            dataToUpdate.validUntil = Timestamp.fromDate(values.validUntil);
        }

      await updateDoc(perkRef, dataToUpdate);
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {daysOfWeek.map((day) => (
                            <FormField
                            key={day}
                            control={form.control}
                            name="availableDays"
                            render={({ field }) => {
                                return (
                                <FormItem
                                    key={day}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                >
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
                                    <FormLabel className="font-normal">
                                        {day}
                                    </FormLabel>
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

    