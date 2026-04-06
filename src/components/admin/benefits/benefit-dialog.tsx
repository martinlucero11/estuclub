
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp, Timestamp, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Globe, Image as ImageIcon, Save, Award, CalendarIcon, Repeat, Plus, Users, ShieldCheck } from 'lucide-react';
import { benefitCategories, type Benefit, type SerializableBenefit } from '@/types/data';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { createConverter } from '@/lib/firestore-converter';

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;
const dayAbbreviations = ["L", "M", "M", "J", "V", "S", "D"];

const benefitSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  highlight: z.string().optional(),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  category: z.string().min(1, 'Selecciona una categoría.'),
  imageUrl: z.string().url('URL de imagen inválida.'),
  location: z.string().min(3, 'La ubicación es requerida.'),
  points: z.coerce.number().min(0).default(0),
  redemptionLimit: z.coerce.number().min(0).optional(),
  validUntil: z.date().optional(),
  availableDays: z.array(z.string()).optional(),
  isVisible: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  // Targeting
  isStudentOnly: z.boolean().default(false),
  isCincoDosOnly: z.boolean().default(false),
  minLevel: z.coerce.number().min(1).max(10).default(1),
  ownerId: z.string().optional(),
});

type BenefitFormValues = z.infer<typeof benefitSchema>;

interface BenefitDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  benefit?: Benefit | SerializableBenefit | null;
  forceSupplierId?: string;
  forceSupplierName?: string;
}

export function BenefitDialog({ isOpen, onOpenChange, benefit, forceSupplierId, forceSupplierName }: BenefitDialogProps) {
  const isEditing = !!benefit;
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch suppliers for admin selection
  const suppliersQuery = useMemo(() => 
    query(collection(firestore, 'roles_supplier').withConverter(createConverter<{ id: string, name: string }>())), 
  [firestore]);
  const { data: suppliers } = useCollection(suppliersQuery);

  const form = useForm<BenefitFormValues>({
    resolver: zodResolver(benefitSchema),
    defaultValues: {
      title: benefit?.title || '',
      highlight: (benefit as any)?.highlight || '',
      description: benefit?.description || '',
      category: benefit?.category || '',
      imageUrl: benefit?.imageUrl || '',
      location: (benefit as any)?.location || '',
      points: benefit?.points || 0,
      redemptionLimit: (benefit as any)?.redemptionLimit || 0,
      validUntil: (benefit as any)?.validUntil ? new Date((benefit as any).validUntil instanceof Timestamp ? (benefit as any).validUntil.toDate() : (benefit as any).validUntil) : undefined,
      availableDays: (benefit as any)?.availableDays || [],
      isVisible: benefit?.isVisible ?? true,
      isFeatured: benefit?.isFeatured ?? false,
      isActive: (benefit as any)?.isActive ?? true,
      isStudentOnly: benefit?.isStudentOnly ?? false,
      isCincoDosOnly: benefit?.isCincoDosOnly ?? false,
      minLevel: benefit?.minLevel ?? 1,
      ownerId: benefit?.supplierId || '',
    },
  });

  useEffect(() => {
    if (isOpen) {
        form.reset({
            title: benefit?.title || '',
            highlight: (benefit as any)?.highlight || '',
            description: benefit?.description || '',
            category: benefit?.category || '',
            imageUrl: benefit?.imageUrl || '',
            location: (benefit as any)?.location || '',
            points: benefit?.points || 0,
            redemptionLimit: (benefit as any)?.redemptionLimit || 0,
            validUntil: (benefit as any)?.validUntil ? new Date((benefit as any).validUntil instanceof Timestamp ? (benefit as any).validUntil.toDate() : (benefit as any).validUntil) : undefined,
            availableDays: (benefit as any)?.availableDays || [],
            isVisible: benefit?.isVisible ?? true,
            isFeatured: benefit?.isFeatured ?? false,
            isActive: (benefit as any)?.isActive ?? true,
            isStudentOnly: benefit?.isStudentOnly ?? false,
            isCincoDosOnly: benefit?.isCincoDosOnly ?? false,
            minLevel: benefit?.minLevel ?? 1,
            ownerId: benefit?.supplierId || '',
        });
    }
  }, [benefit, isOpen, form]);

  const onSubmit = async (values: BenefitFormValues) => {
    setIsSubmitting(true);
    try {
      const dataToSave: any = {
        ...values,
        updatedAt: serverTimestamp(),
      };

      if (values.validUntil) {
          dataToSave.validUntil = Timestamp.fromDate(values.validUntil);
      } else {
          dataToSave.validUntil = null;
      }

      if (isEditing && benefit) {
        const benefitRef = doc(firestore, 'perks', benefit.id);
        await updateDoc(benefitRef, dataToSave);
        toast({ title: 'Beneficio actualizado', description: 'Los cambios han sido guardados.' });
      } else {
        const perksRef = collection(firestore, 'perks');
        const supplierName = forceSupplierName || suppliers?.find(s => s.id === values.ownerId)?.name || 'Proveedor Estuclub';
        
        await addDoc(perksRef, {
          ...dataToSave,
          supplierId: forceSupplierId || values.ownerId,
          supplierName: supplierName,
          createdAt: serverTimestamp(),
          redemptionCount: 0,
        });
        toast({ title: 'Beneficio lanzado', description: 'El beneficio ya está disponible en Estuclub.' });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving benefit:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el beneficio.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-[3rem] border-white/10 shadow-3xl bg-card/95 backdrop-blur-xl overflow-hidden p-0">
        <div className="bg-primary/10 p-8 pb-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Gift className="h-32 w-32 rotate-12" />
            </div>
            <DialogHeader className="relative z-10">
                <DialogTitle className="text-4xl font-black italic tracking-tighter uppercase font-montserrat">
                    {isEditing ? 'Editar' : 'Nuevo'} <span className="text-primary italic">Beneficio</span>
                </DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">
                    {isEditing ? 'Ajusta los parámetros de esta promoción.' : 'Lanza una nueva oferta exclusiva para los estudiantes.'}
                </DialogDescription>
            </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-8 -mt-6 bg-card rounded-t-[3rem] max-h-[70vh] overflow-y-auto custom-scrollbar relative z-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!forceSupplierId && (
                    <FormField
                        control={form.control}
                        name="ownerId"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Proveedor Responsable</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                <SelectTrigger className="h-14 rounded-2xl bg-background border-white/5 focus:ring-primary shadow-sm font-bold">
                                    <SelectValue placeholder="Busca un cluber..." />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-2xl border-white/10 shadow-2xl">
                                {suppliers?.map(s => (
                                    <SelectItem key={s.id} value={s.id} className="font-bold">{s.name}</SelectItem>
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
                    name="title"
                    render={({ field }) => (
                        <FormItem className="md:col-span-2">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Título de la Promoción</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: 2x1 en Hamburguesas" {...field} className="h-14 rounded-2xl bg-background border-white/5 font-bold text-lg" />
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Categoría</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                            <SelectTrigger className="h-12 rounded-xl bg-background border-white/5">
                                <SelectValue placeholder="Rubro..." />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {benefitCategories.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Costo en Puntos</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Award className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                <Input type="number" {...field} className="h-12 pl-12 rounded-xl bg-background border-white/5 font-mono font-bold" />
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Condiciones / Info</FormLabel>
                  <FormControl>
                    <Textarea 
                        placeholder="Describe el beneficio y sus restricciones..." 
                        {...field} 
                        className="min-h-[100px] rounded-2xl bg-background border-white/5 focus:border-primary/40 font-medium text-sm leading-relaxed" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Flyer / Imagen URL</FormLabel>
                    <div className="relative">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                        <FormControl>
                            <Input placeholder="https://..." {...field} className="h-12 pl-12 rounded-xl bg-background border-white/5 text-xs" />
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
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">Válido en...</FormLabel>
                    <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                        <FormControl>
                            <Input placeholder="Ej: Av. Colón 123" {...field} className="h-12 pl-12 rounded-xl bg-background border-white/5 text-xs" />
                        </FormControl>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            {/* TARGETING SECTION */}
            <div className="p-6 rounded-[2rem] bg-black/5 border border-black/5 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Configuración de Audiencia</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 border border-black/5">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest">Solo Estudiantes</span>
                            <span className="text-[8px] font-bold opacity-40 uppercase tracking-tight">Requiere certificado verificado</span>
                        </div>
                        <FormField
                            control={form.control}
                            name="isStudentOnly"
                            render={({ field }) => (
                                <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            )}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 border border-black/5">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Cinco.Dos Social</span>
                            <span className="text-[8px] font-bold opacity-40 uppercase tracking-tight">Solo beneficiarios comedor</span>
                        </div>
                        <FormField
                            control={form.control}
                            name="isCincoDosOnly"
                            render={({ field }) => (
                                <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="minLevel"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 border border-black/5">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-widest">Nivel de Usuario Mínimo</span>
                                        <span className="text-[8px] font-bold opacity-40 uppercase tracking-tight">Gamificación Estuclub</span>
                                    </div>
                                    <FormControl>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xl font-black text-primary">Lv.{field.value}</span>
                                            <Input type="range" min={1} max={10} {...field} className="w-32 h-2 accent-primary" />
                                        </div>
                                    </FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white border border-black/5">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest">Destacado</span>
                    </div>
                    <FormField
                        control={form.control}
                        name="isFeatured"
                        render={({ field }) => (
                            <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-yellow-500" />
                            </FormControl>
                        )}
                    />
                </div>

                <div className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white border border-black/5">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest">Visible</span>
                    </div>
                    <FormField
                        control={form.control}
                        name="isVisible"
                        render={({ field }) => (
                            <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        )}
                    />
                </div>
            </div>

            <DialogFooter className="pt-10 flex flex-col sm:flex-row gap-4 border-t border-black/5">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-[1.5rem] h-14 w-full sm:w-auto px-8 font-black uppercase text-[10px] tracking-widest opacity-40">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-[1.5rem] h-14 w-full sm:flex-1 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-3">
                {isSubmitting ? 'Guardando...' : (
                    <>
                        <ShieldCheck className="h-5 w-5" />
                        {isEditing ? 'Confirmar Cambios' : 'Lanzar Beneficio'}
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

const Gift = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
  </svg>
);
