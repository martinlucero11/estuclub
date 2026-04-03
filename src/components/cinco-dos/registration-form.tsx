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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const formSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres.'),
  email: z.string().email('Correo electrónico no válido.'),
  phone: z.string().min(8, 'Número de teléfono no válido.'),
  address: z.string().min(5, 'La dirección es obligatoria.'),
  institution: z.string().min(3, 'Debes ingresar tu institución educativa.'),
  courseYear: z.enum(['1', '2', '3', '4', '5', 'Otro'], { required_error: 'Selecciona tu año de cursado.' }),
  contactName: z.string().min(2, 'Nombre de contacto obligatorio.'),
  contactPhone: z.string().min(8, 'Teléfono de contacto no válido.'),
  contactRelationship: z.string().min(2, 'Especifica el vínculo familiar.'),
});

type FormValues = z.infer<typeof formSchema>;

export function CincoDosForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user?.displayName?.split(' ')[0] || '',
      lastName: user?.displayName?.split(' ').slice(1).join(' ') || '',
      email: user?.email || '',
      phone: '',
      address: '',
      institution: '',
      courseYear: '1',
      contactName: '',
      contactPhone: '',
      contactRelationship: '',
    },
  });

  async function onSubmit(values: FormValues) {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const applicationsRef = collection(firestore, 'comedor_applications');
      const dataToSave: any = {
        userId: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      Object.keys(values).forEach(key => {
        const value = (values as any)[key];
        if (value !== undefined) {
          dataToSave[key] = value;
        }
      });

      await addDoc(applicationsRef, dataToSave);

      toast({
        title: '¡Solicitud enviada!',
        description: 'Hemos recibido tus datos correctamente.',
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo enviar la solicitud. Inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative group">
        <div className="absolute -inset-[1px] rounded-[2rem] bg-gradient-to-b from-white/20 to-transparent opacity-50 pointer-events-none" />
        <Card className="bg-[#000000]/80 backdrop-blur-3xl border-0 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden rounded-[2rem] relative z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
            <div className="p-8 border-b border-white/5 relative flex flex-col items-center sm:items-start text-center sm:text-left">
                <h2 className="text-2xl font-bold text-white tracking-tight">Afiliación a la Red</h2>
                <p className="text-sm text-foreground mt-2 font-medium">Completa tu perfil para solicitar acceso a la mesa principal de Cinco.Dos</p>
            </div>
        <CardContent className="p-6">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Datos Personales */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white/80 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">1</span>
                        Tus Datos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="firstName" render={({ field }) => (
                            <FormItem><FormLabel className="text-foreground">Nombre</FormLabel><FormControl>
                                <Input placeholder="Juan" {...field} className="bg-white/[0.03] border-white/5 text-white placeholder:text-foreground focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20 rounded-xl h-11" />
                            </FormControl><FormMessage className="text-red-400" /></FormItem>
                        )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => (
                            <FormItem><FormLabel className="text-foreground">Apellido</FormLabel><FormControl>
                                <Input placeholder="Pérez" {...field} className="bg-white/[0.03] border-white/5 text-white placeholder:text-foreground focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20 rounded-xl h-11" />
                            </FormControl><FormMessage className="text-red-400" /></FormItem>
                        )} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel className="text-foreground">Correo Electrónico</FormLabel><FormControl>
                                <Input type="email" placeholder="juan@ejemplo.com" {...field} className="bg-white/[0.03] border-white/5 text-white placeholder:text-foreground focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20 rounded-xl h-11" />
                            </FormControl><FormMessage className="text-red-400" /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel className="text-foreground">Teléfono Celular</FormLabel><FormControl>
                                <Input type="tel" placeholder="+54 9 11..." {...field} className="bg-white/[0.03] border-white/5 text-white placeholder:text-foreground focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20 rounded-xl h-11" />
                            </FormControl><FormMessage className="text-red-400" /></FormItem>
                        )} />
                    </div>

                    <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem><FormLabel className="text-foreground">Dirección actual (Residencia)</FormLabel><FormControl>
                            <Input placeholder="Calle, Número, Ciudad" {...field} className="bg-white/[0.03] border-white/5 text-white placeholder:text-foreground focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20 rounded-xl h-11" />
                        </FormControl><FormMessage className="text-red-400" /></FormItem>
                    )} />
                </div>

                <div className="h-px bg-white/10 w-full my-6" />

                {/* Datos Académicos */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white/80 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">2</span>
                        Datos Académicos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="institution" render={({ field }) => (
                            <FormItem><FormLabel className="text-foreground">Institución Educativa</FormLabel><FormControl>
                                <Input placeholder="Ej: UNLP, UBA..." {...field} className="bg-white/[0.03] border-white/5 text-white placeholder:text-foreground focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20 rounded-xl h-11" />
                            </FormControl><FormMessage className="text-red-400" /></FormItem>
                        )} />
                        <FormField control={form.control} name="courseYear" render={({ field }) => (
                            <FormItem><FormLabel className="text-foreground">Año de Cursado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="bg-white/[0.03] border-white/5 text-white focus:ring-1 focus:ring-white/20 rounded-xl h-11"><SelectValue placeholder="Selecciona el año" /></SelectTrigger></FormControl>
                                <SelectContent className="bg-background border-white/10 text-white">
                                    <SelectItem value="1">1er Año</SelectItem>
                                    <SelectItem value="2">2do Año</SelectItem>
                                    <SelectItem value="3">3er Año</SelectItem>
                                    <SelectItem value="4">4to Año</SelectItem>
                                    <SelectItem value="5">5to Año</SelectItem>
                                    <SelectItem value="Otro">Otro / Posgrado</SelectItem>
                                </SelectContent>
                            </Select><FormMessage className="text-red-400" /></FormItem>
                        )} />
                    </div>
                </div>

                <div className="h-px bg-white/10 w-full my-6" />

                {/* Contacto de Emergencia */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white/80 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">3</span>
                        Contacto de Emergencia
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="contactName" render={({ field }) => (
                            <FormItem><FormLabel className="text-foreground">Nombre Completo</FormLabel><FormControl>
                                <Input placeholder="Familiar o amigo" {...field} className="bg-white/[0.03] border-white/5 text-white placeholder:text-foreground focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20 rounded-xl h-11" />
                            </FormControl><FormMessage className="text-red-400" /></FormItem>
                        )} />
                        <FormField control={form.control} name="contactPhone" render={({ field }) => (
                            <FormItem><FormLabel className="text-foreground">Teléfono</FormLabel><FormControl>
                                <Input type="tel" placeholder="Número" {...field} className="bg-white/[0.03] border-white/5 text-white placeholder:text-foreground focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20 rounded-xl h-11" />
                            </FormControl><FormMessage className="text-red-400" /></FormItem>
                        )} />
                        <FormField control={form.control} name="contactRelationship" render={({ field }) => (
                            <FormItem><FormLabel className="text-foreground">Vínculo</FormLabel><FormControl>
                                <Input placeholder="Ej: Madre, Padre, Hermano..." {...field} className="bg-white/[0.03] border-white/5 text-white placeholder:text-foreground focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20 rounded-xl h-11" />
                            </FormControl><FormMessage className="text-red-400" /></FormItem>
                        )} />
                    </div>
                </div>

                <div className="pt-8 relative z-20">
                    <Button type="submit" disabled={isSubmitting} className="relative group w-full h-14 text-lg font-bold rounded-2xl overflow-hidden bg-white text-black hover:bg-background transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 group-hover:translate-x-full transition-all duration-700 ease-in-out -translate-x-full" />
                        {isSubmitting ? (
                            <span className="flex items-center"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Autorizando...</span>
                        ) : (
                            <span className="flex items-center"><Send className="mr-2 h-5 w-5" /> Solicitar Acceso Reservado</span>
                        )}
                    </Button>
                </div>
            </form>
            </Form>
        </CardContent>
        </Card>
    </div>
  );
}

