
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Input } from '../ui/input';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM format

const dayScheduleSchema = z.object({
  active: z.boolean(),
  startTime: z.string().regex(timeRegex, "Formato inválido (HH:MM)"),
  endTime: z.string().regex(timeRegex, "Formato inválido (HH:MM)"),
});

const availabilitySchema = z.object({
  schedule: z.array(dayScheduleSchema),
}).refine(data => {
    for(const day of data.schedule) {
        if(day.active && day.startTime >= day.endTime) {
            return false;
        }
    }
    return true;
}, {
    message: "La hora de fin debe ser posterior a la hora de inicio.",
    path: ["schedule"], // You can refine the path to a specific field
});

const defaultSchedule = [
  { day: 'Lunes', active: false, startTime: '09:00', endTime: '17:00' },
  { day: 'Martes', active: false, startTime: '09:00', endTime: '17:00' },
  { day: 'Miércoles', active: false, startTime: '09:00', endTime: '17:00' },
  { day: 'Jueves', active: false, startTime: '09:00', endTime: '17:00' },
  { day: 'Viernes', active: false, startTime: '09:00', endTime: '17:00' },
  { day: 'Sábado', active: false, startTime: '10:00', endTime: '14:00' },
  { day: 'Domingo', active: false, startTime: '10:00', endTime: '14:00' },
];

export default function AvailabilityManager() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const availabilityRef = useMemoFirebase(() => user ? doc(firestore, `roles_supplier/${user.uid}/availability/schedule`) : null, [user, firestore]);
  const { data: availabilityData, isLoading: isDataLoading } = useDoc(availabilityRef);
  
  const form = useForm<z.infer<typeof availabilitySchema>>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: { schedule: defaultSchedule.map(d => ({ active: d.active, startTime: d.startTime, endTime: d.endTime }))},
  });
  
  const { fields } = useFieldArray({
    control: form.control,
    name: "schedule",
  });

  useEffect(() => {
    if (availabilityData?.schedule) {
      const scheduleFromDb = defaultSchedule.map(dayInfo => {
        const dbDay = availabilityData.schedule[dayInfo.day];
        return dbDay ? { ...dayInfo, ...dbDay } : dayInfo;
      });
      const formValues = scheduleFromDb.map(d => ({ active: d.active, startTime: d.startTime, endTime: d.endTime }));
      form.reset({ schedule: formValues });
    }
  }, [availabilityData, form]);

  async function onSubmit(values: z.infer<typeof availabilitySchema>) {
    if (!user || !availabilityRef) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la disponibilidad.' });
      return;
    }

    try {
      // Transform array into object for Firestore
      const scheduleObject = values.schedule.reduce((acc, day, index) => {
        const dayName = defaultSchedule[index].day;
        acc[dayName] = day;
        return acc;
      }, {} as {[key: string]: any});

      await setDoc(availabilityRef, { schedule: scheduleObject });

      toast({
        title: 'Disponibilidad actualizada',
        description: 'Tus horarios de trabajo han sido guardados.',
      });
    } catch (error: any) {
      console.error('Error updating availability:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la disponibilidad.',
      });
    }
  }

  if (isDataLoading) {
      return (
          <div className='space-y-4'>
              {[...Array(7)].map(i => <Skeleton key={i} className='h-16 w-full' />)}
          </div>
      )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((field, index) => {
            const dayName = defaultSchedule[index].day;
            const isActive = form.watch(`schedule.${index}.active`);
            return (
                 <Card key={field.id}>
                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                         <div className='flex items-center justify-between md:w-40'>
                            <FormLabel className='text-base font-medium'>{dayName}</FormLabel>
                             <FormField
                                control={form.control}
                                name={`schedule.${index}.active`}
                                render={({ field }) => (
                                    <FormItem>
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
                        <div className={`flex-1 grid grid-cols-2 gap-4 transition-opacity ${isActive ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                            <FormField
                                control={form.control}
                                name={`schedule.${index}.startTime`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className='text-xs'>Inicio</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`schedule.${index}.endTime`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className='text-xs'>Fin</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
            )
        })}
        {form.formState.errors.schedule?.root?.message && (
            <p className='text-sm font-medium text-destructive'>{form.formState.errors.schedule.root.message}</p>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Horarios
        </Button>
      </form>
    </Form>
  );
}
