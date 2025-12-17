
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useState } from 'react';
import { PlusCircle, Clock } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  duration: z.coerce.number().min(5, 'La duración debe ser de al menos 5 minutos.'),
});

export default function AddServiceForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      duration: 30,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para crear un servicio.'});
        return;
    }

    setIsSubmitting(true);
    try {
      const servicesRef = collection(firestore, 'roles_supplier', user.uid, 'services');
      await addDoc(servicesRef, values);

      toast({
        title: '¡Nuevo Servicio Añadido!',
        description: `El servicio "${values.name}" ha sido creado.`,
      });
      form.reset();
    } catch (error: any) {
      console.error("Error adding service: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo añadir el servicio. Inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Servicio</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Consulta Médica, Asesoría Legal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción del Servicio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe en qué consiste el servicio."
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
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duración (en minutos)</FormLabel>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FormControl>
                    <Input type="number" placeholder="Ej: 30" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Añadiendo...' : (
                <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Servicio
                </>
            )}
        </Button>
      </form>
    </Form>
  );
}
