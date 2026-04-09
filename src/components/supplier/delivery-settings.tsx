'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore, useUser, useCollectionOnce } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import type { SupplierProfile, Category } from '@/types/data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Clock, Plus, Trash2, Save, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function DeliverySettings({ supplier }: { supplier: SupplierProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    // Day keys and labels
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayLabels: Record<string, string> = {
        monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
        thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
    };

    // Form state
    const [schedule, setSchedule] = useState<any>(supplier.deliverySchedule || {});
    const [prepTime, setPrepTime] = useState<number>(supplier.avgPrepTime || 30);
    const [deliveryCategory, setDeliveryCategory] = useState<string>(supplier.deliveryCategory || '');

    // Fetch categories from Firestore to match the home carrusel
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

    // Initialize schedule if empty
    useEffect(() => {
        if (Object.keys(schedule).length === 0) {
            const initial: any = {};
            dayKeys.forEach(day => {
                initial[day] = { active: true, intervals: [{ start: '09:00', end: '21:00' }] };
            });
            setSchedule(initial);
        }
    }, []);

    const toggleDay = (day: string) => {
        setSchedule((prev: any) => ({
            ...prev,
            [day]: { ...prev[day], active: !prev[day]?.active }
        }));
    };

    const addInterval = (day: string) => {
        setSchedule((prev: any) => ({
            ...prev,
            [day]: { 
                ...prev[day], 
                intervals: [...(prev[day]?.intervals || []), { start: '09:00', end: '18:00' }] 
            }
        }));
    };

    const removeInterval = (day: string, index: number) => {
        setSchedule((prev: any) => ({
            ...prev,
            [day]: { 
                ...prev[day], 
                intervals: prev[day].intervals.filter((_: any, i: number) => i !== index) 
            }
        }));
    };

    const updateInterval = (day: string, index: number, field: 'start' | 'end', value: string) => {
        const newIntervals = [...schedule[day].intervals];
        newIntervals[index][field] = value;
        setSchedule((prev: any) => ({
            ...prev,
            [day]: { ...prev[day], intervals: newIntervals }
        }));
    };

    const handleSave = async () => {
        if (!firestore) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(firestore, 'roles_supplier', supplier.id), {
                deliverySchedule: schedule,
                avgPrepTime: prepTime,
                deliveryCategory: deliveryCategory,
                updatedAt: serverTimestamp()
            });
            toast({ title: "Ajustes Guardados", description: "La configuración de entrega ha sido actualizada." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo actualizar la configuración.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Save Action */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase italic">Ajustes de Delivery</h2>
                    <p className="text-xs font-bold text-foreground uppercase tracking-widest opacity-60">Controla cuándo y cómo recibes los pedidos.</p>
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="rounded-2xl h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] shadow-xl group"
                >
                    <Save className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    {isSaving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Prep Time */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="rounded-[2.5rem] border-white/5 bg-card/50 backdrop-blur-sm overflow-hidden border-2 border-dashed">
                        <CardHeader className="p-8">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                <Timer className="h-5 w-5 text-primary" />
                                Tiempo de Preparación
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold text-foreground uppercase opacity-60">Impacto directo en la expectativa del cliente.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                                {[15, 30, 45].map(time => (
                                    <Button
                                        key={time}
                                        type="button"
                                        variant={prepTime === time ? 'secondary' : 'outline'}
                                        onClick={() => setPrepTime(time)}
                                        className={cn(
                                            "rounded-xl h-16 font-black uppercase tracking-widest text-[11px] flex flex-col gap-1 border-white/10",
                                            prepTime === time && "bg-primary/20 text-primary border-primary/30"
                                        )}
                                    >
                                        <span className="text-lg">{time}</span>
                                        <span>MIN</span>
                                    </Button>
                                ))}
                            </div>
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                <p className="text-[10px] font-medium leading-relaxed italic text-foreground">
                                    Este tiempo se mostrará al estudiante antes de confirmar su pedido. Sé realista para evitar reclamos.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] border-white/5 bg-card/50 backdrop-blur-sm overflow-hidden border-2 border-dashed">
                        <CardHeader className="p-8">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                <Plus className="h-5 w-5 text-primary" />
                                Clasificación
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold text-foreground uppercase opacity-60">Categoría principal del local.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest opacity-50 ml-1">Categoría de Entrega</Label>
                                <Select value={deliveryCategory} onValueChange={setDeliveryCategory}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-background/50 border-white/10 font-bold">
                                        <SelectValue placeholder="Seleccionar categoría..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-white/10 glass glass-dark">
                                        {deliveryCategories.map(cat => (
                                            <SelectItem key={cat} value={cat} className="rounded-xl font-bold py-3">{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                <p className="text-[10px] font-medium leading-relaxed italic text-foreground">
                                    Esto determina en qué sección de la App aparecerá tu tienda para los estudiantes.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Schedule */}
                <div className="lg:col-span-2">
                    <Card className="rounded-[2.5rem] border-white/5 bg-card/50 backdrop-blur-sm shadow-premium overflow-hidden">
                        <CardHeader className="px-8 py-6 border-b border-white/5">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                <Clock className="h-5 w-5 text-primary" />
                                Horarios de Atención
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-white/5">
                                {dayKeys.map(day => (
                                    <div key={day} className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center">
                                        <div className="min-w-[120px] flex items-center justify-between md:block">
                                            <span className="text-sm font-black uppercase tracking-widest block">{dayLabels[day]}</span>
                                            <Switch 
                                                checked={schedule[day]?.active} 
                                                onCheckedChange={() => toggleDay(day)}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            {schedule[day]?.active ? (
                                                <div className="space-y-3">
                                                    {(schedule[day]?.intervals || []).map((interval: any, index: number) => (
                                                        <div key={index} className="flex items-center gap-3 animate-in slide-in-from-left-4 fade-in duration-300">
                                                            <div className="flex-1 grid grid-cols-2 gap-2">
                                                                <div className="relative">
                                                                    <Input 
                                                                        type="time" 
                                                                        className="rounded-xl bg-background/50 h-11 font-bold pl-10" 
                                                                        value={interval.start}
                                                                        onChange={(e) => updateInterval(day, index, 'start', e.target.value)}
                                                                    />
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-foreground/40">Desde</span>
                                                                </div>
                                                                <div className="relative">
                                                                    <Input 
                                                                        type="time" 
                                                                        className="rounded-xl bg-background/50 h-11 font-bold pl-10" 
                                                                        value={interval.end}
                                                                        onChange={(e) => updateInterval(day, index, 'end', e.target.value)}
                                                                    />
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-foreground/40">Hasta</span>
                                                                </div>
                                                            </div>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                onClick={() => removeInterval(day, index)}
                                                                className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/10"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => addInterval(day)}
                                                        className="rounded-xl h-10 w-full border-dashed border-primary/20 text-primary/60 hover:text-primary hover:bg-primary/5 font-black uppercase tracking-widest text-[9px]"
                                                    >
                                                        <Plus className="h-3 w-3 mr-2" />
                                                        Añadir Turno
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="h-11 flex items-center px-4 rounded-xl bg-white/5 border border-white/5 opacity-50">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Local Cerrado</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

