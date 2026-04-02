'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, orderBy, setDoc, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { createConverter } from '@/lib/firestore-converter';
import { 
  Calendar, Clock, Plus, Trash2, Edit3, 
  CheckCircle2, XCircle, User, Info, 
  ChevronRight, CalendarDays, Settings2,
  DollarSign, Timer, ScrollText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
    Dialog, DialogContent, DialogHeader, 
    DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Service {
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    active: boolean;
}

interface Appointment {
    id: string;
    userName: string;
    userPhone: string;
    serviceName: string;
    startTime: any; // Timestamp
    status: 'pending' | 'attended' | 'absent' | 'cancelled';
}

export function TurneroManager({ supplierId }: { supplierId: string }) {
    const [view, setView] = useState<'agenda' | 'services' | 'availability'>('agenda');
    const { toast } = useToast();
    const firestore = useFirestore();

    return (
        <div className="space-y-8">
            {/* Sub-Navigation (Minimalist) */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl w-fit border border-slate-200 dark:border-white/10">
                <SubTab active={view === 'agenda'} onClick={() => setView('agenda')} icon={CalendarDays} label="Agenda Hoy" />
                <SubTab active={view === 'services'} onClick={() => setView('services')} icon={Settings2} label="Servicios" />
                <SubTab active={view === 'availability'} onClick={() => setView('availability')} icon={Clock} label="Horarios" />
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {view === 'agenda' && <AgendaView supplierId={supplierId} />}
                {view === 'services' && <ServicesView supplierId={supplierId} />}
                {view === 'availability' && <AvailabilityView supplierId={supplierId} />}
            </div>
        </div>
    );
}

function SubTab({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <Button 
            variant="ghost" 
            onClick={onClick}
            className={cn(
                "rounded-xl h-10 px-6 font-black text-[9px] uppercase tracking-widest transition-all",
                active ? "bg-white dark:bg-white/10 text-primary shadow-sm" : "text-muted-foreground hover:text-slate-900"
            )}
        >
            <Icon className="mr-2 h-3.5 w-3.5" />
            {label}
        </Button>
    )
}

// ─── AGENDA VIEW ──────────────────────────────────────────

function AgendaView({ supplierId }: { supplierId: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const appointmentsQuery = useMemo(() => {
        if (!firestore) return null;
        
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        return query(
            collection(firestore, 'appointments').withConverter(createConverter<Appointment>()),
            where('supplierId', '==', supplierId),
            where('startTime', '>=', Timestamp.fromDate(start)),
            where('startTime', '<=', Timestamp.fromDate(end)),
            orderBy('startTime', 'asc')
        );
    }, [firestore, supplierId]);

    const { data: appointments, isLoading } = useCollection<Appointment>(appointmentsQuery);

    const handleUpdateStatus = async (id: string, status: 'attended' | 'absent') => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'appointments', id), { status });
            toast({ title: status === 'attended' ? "¡Cliente Atendido!" : "Cliente Ausente", description: "Estado actualizado." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "No se pudo actualizar el turno." });
        }
    };

    if (isLoading) return <Skeleton className="h-64 w-full rounded-[3rem]" />;

    return (
        <div className="space-y-6">
            {!appointments || appointments.length === 0 ? (
                <Card className="rounded-[3rem] border border-dashed border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 py-24 text-center flex flex-col items-center justify-center gap-4">
                    <div className="h-20 w-20 rounded-[2rem] bg-slate-100 dark:bg-white/5 flex items-center justify-center opacity-40">
                        <Calendar className="h-10 w-10 text-slate-300" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Sin turnos para hoy</p>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {appointments.map((apt) => (
                        <Card key={apt.id} className="rounded-[2rem] border-slate-100 dark:border-white/5 bg-white/50 dark:bg-card/30 overflow-hidden group hover:border-primary/20 transition-all">
                            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex flex-col items-center justify-center border border-primary/20 shrink-0">
                                        <Clock className="h-6 w-6 text-primary mb-1" />
                                        <span className="text-[10px] font-black italic">
                                            {apt.startTime ? format(apt.startTime.toDate(), "HH:mm") : '--:--'}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xl font-black tracking-tighter uppercase italic">{apt.userName}</h4>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black text-[8px] uppercase px-2">{apt.serviceName}</Badge>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{apt.userPhone}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {apt.status === 'pending' ? (
                                        <>
                                            <Button 
                                                variant="ghost" 
                                                onClick={() => handleUpdateStatus(apt.id, 'absent')}
                                                className="h-12 rounded-xl px-6 font-black text-[9px] uppercase tracking-widest text-red-500 hover:bg-red-500/10"
                                            >
                                                AUSENTE
                                            </Button>
                                            <Button 
                                                onClick={() => handleUpdateStatus(apt.id, 'attended')}
                                                className="h-12 rounded-xl px-10 font-black text-[9px] uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                            >
                                                ATENDIDO
                                            </Button>
                                        </>
                                    ) : (
                                        <div className={cn(
                                            "flex items-center gap-2 px-6 py-2 rounded-xl border font-black text-[9px] uppercase tracking-widest",
                                            apt.status === 'attended' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                                        )}>
                                            {apt.status === 'attended' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                            {apt.status === 'attended' ? "Completado" : "No asistió"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── SERVICES VIEW ────────────────────────────────────────

function ServicesView({ supplierId }: { supplierId: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    const servicesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'roles_supplier', supplierId, 'services').withConverter(createConverter<Service>()),
            orderBy('name', 'asc')
        );
    }, [firestore, supplierId]);

    const { data: services, isLoading } = useCollection<Service>(servicesQuery);

    const handleDelete = async (id: string) => {
        if (!firestore || !confirm('¿Eliminar servicio?')) return;
        try {
            await deleteDoc(doc(firestore, 'roles_supplier', supplierId, 'services', id));
            toast({ title: "Servicio Eliminado" });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "No se pudo eliminar." });
        }
    };

    if (isLoading) return <Skeleton className="h-64 w-full rounded-[3rem]" />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Catálogo de Turnos</h3>
                    <p className="text-2xl font-black tracking-tighter italic uppercase underline decoration-primary/30 underline-offset-4">Gestión de Servicios</p>
                </div>
                <Button 
                    onClick={() => { setEditingService(null); setIsFormOpen(true); }}
                    className="h-12 rounded-2xl bg-primary text-white font-black text-[9px] uppercase tracking-widest px-8 shadow-xl shadow-primary/20 border-none"
                >
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
                </Button>
            </div>

            <div className="grid gap-6">
                {!services || services.length === 0 ? (
                    <div className="py-24 text-center bg-white/5 border border-dashed border-white/5 rounded-[3rem] opacity-40">
                         <Info className="h-12 w-12 mx-auto mb-4" />
                         <p className="text-xs font-black uppercase tracking-widest">No has creado servicios todavía</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.map((svc) => (
                            <Card key={svc.id} className="rounded-[2.5rem] border-slate-100 dark:border-white/5 bg-card/30 p-8 flex justify-between items-start group hover:border-primary/20 transition-all">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <h4 className="text-xl font-black uppercase tracking-tighter italic">{svc.name}</h4>
                                        <p className="text-[10px] font-bold text-muted-foreground leading-relaxed max-w-xs">{svc.description}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2">
                                            <Timer className="h-4 w-4 text-primary" />
                                            <span className="text-[11px] font-black italic">{svc.duration} min</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-primary" />
                                            <span className="text-[11px] font-black italic tracking-tighter">$ {svc.price.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => { setEditingService(svc); setIsFormOpen(true); }}>
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-red-500/10 hover:text-red-500" onClick={() => handleDelete(svc.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <ServiceForm 
                open={isFormOpen} 
                onOpenChange={setIsFormOpen} 
                supplierId={supplierId} 
                editingService={editingService} 
            />
        </div>
    )
}

// ─── AVAILABILITY VIEW ────────────────────────────────────

function AvailabilityView({ supplierId }: { supplierId: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    // Days as keys for consistency with Availability type
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayLabels: Record<string, string> = {
        monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', 
        thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
    };

    const scheduleRef = useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'roles_supplier', supplierId, 'availability', 'schedule');
    }, [firestore, supplierId]);

    const { data: availability, isLoading } = useDoc<any>(scheduleRef);
    const [localSchedule, setLocalSchedule] = useState<any>(null);

    // Sync local state when data loads
    useEffect(() => {
        if (availability?.schedule) {
            setLocalSchedule(availability.schedule);
        } else if (!isLoading && !localSchedule) {
            // Initial default schedule
            const defaultSchedule: any = {};
            dayKeys.forEach(day => {
                defaultSchedule[day] = { active: true, startTime: '09:00', endTime: '18:00' };
            });
            setLocalSchedule(defaultSchedule);
        }
    }, [availability, isLoading]);

    const handleToggleDay = (day: string, active: boolean) => {
        setLocalSchedule((prev: any) => ({
            ...prev,
            [day]: { ...prev[day], active }
        }));
    };

    const handleTimeChange = (day: string, field: 'startTime' | 'endTime', value: string) => {
        setLocalSchedule((prev: any) => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    const handleSave = async () => {
        if (!firestore || !scheduleRef) return;
        setIsSaving(true);
        try {
            await setDoc(scheduleRef, { 
                schedule: localSchedule,
                updatedAt: serverTimestamp()
            }, { merge: true });
            
            toast({ title: "Configuración Guardada", description: "Tus horarios han sido actualizados." });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Error", description: "No se pudo guardar la configuración." });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !localSchedule) return <Skeleton className="h-96 w-full rounded-[3rem]" />;

    return (
        <Card className="rounded-[3rem] border border-slate-100 dark:border-white/5 bg-white/50 dark:bg-background/50 overflow-hidden">
            <CardHeader className="p-10 border-b border-slate-100 dark:border-white/5">
                <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">Disponibilidad Semanal</CardTitle>
                <CardDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Configura tus horarios para que los estudiantes reserven.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
                {dayKeys.map((day) => (
                    <div key={day} className={cn(
                        "flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[2rem] border transition-all",
                        localSchedule[day]?.active 
                            ? "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 group hover:bg-primary/5" 
                            : "bg-slate-100/30 dark:bg-white/2 border-transparent opacity-50"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center font-black uppercase italic transition-colors",
                                localSchedule[day]?.active ? "bg-primary/10 text-primary" : "bg-slate-200 dark:bg-white/10 text-muted-foreground"
                            )}>
                                {dayLabels[day][0]}
                            </div>
                            <span className="text-sm font-black uppercase tracking-widest">{dayLabels[day]}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {localSchedule[day]?.active ? (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                    <Input 
                                        type="time" 
                                        value={localSchedule[day].startTime} 
                                        onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                                        className="h-10 w-24 rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-[10px] font-black"
                                    />
                                    <span className="text-[10px] font-black text-muted-foreground">A</span>
                                    <Input 
                                        type="time" 
                                        value={localSchedule[day].endTime} 
                                        onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                                        className="h-10 w-24 rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-[10px] font-black"
                                    />
                                </div>
                            ) : (
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Cerrado</span>
                            )}
                            <Switch 
                                className="data-[state=checked]:bg-primary" 
                                checked={localSchedule[day]?.active} 
                                onCheckedChange={(checked) => handleToggleDay(day, checked)}
                            />
                        </div>
                    </div>
                ))}
                
                <div className="pt-8">
                    <Button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full h-16 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs italic shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        {isSaving ? 'GUARDANDO...' : 'GUARDAR CONFIGURACIÓN'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

// ─── SERVICE FORM MODAL ───────────────────────────────────

function ServiceForm({ open, onOpenChange, supplierId, editingService }: { open: boolean, onOpenChange: (v: boolean) => void, supplierId: string, editingService: Service | null }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!firestore) return;
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            duration: parseInt(formData.get('duration') as string),
            price: parseFloat(formData.get('price') as string),
            active: true,
            updatedAt: serverTimestamp(),
        };

        try {
            if (editingService) {
                await updateDoc(doc(firestore, 'roles_supplier', supplierId, 'services', editingService.id), data);
                toast({ title: "Servicio Actualizado" });
            } else {
                await addDoc(collection(firestore, 'roles_supplier', supplierId, 'services'), { 
                    ...data, 
                    createdAt: serverTimestamp() 
                });
                toast({ title: "Servicio Creado" });
            }
            onOpenChange(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "No se pudo guardar." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl glass dark:bg-[#121212]/95 backdrop-blur-xl sm:max-w-xl">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <DialogHeader className="p-10 pb-6 border-b border-primary/5">
                        <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase leading-none">{editingService ? 'Editar' : 'Nuevo'} Servicio</DialogTitle>
                        <DialogDescription className="text-xs font-bold text-muted-foreground italic mt-2 uppercase tracking-widest">Define los detalles de tu prestación profesional.</DialogDescription>
                    </DialogHeader>

                    <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto scrollbar-premium">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 text-primary">Nombre del Servicio</Label>
                            <div className="relative">
                                <ScrollText className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                                <Input name="name" defaultValue={editingService?.name} required className="h-16 pl-16 rounded-2xl bg-white/10 border-white/5 font-black text-sm uppercase tracking-widest placeholder:text-muted-foreground/20" placeholder="EJ: CORTE DE BARBA" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 text-primary">Duración (minutos)</Label>
                            <div className="relative">
                                <Timer className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                                <Input name="duration" type="number" defaultValue={editingService?.duration} required className="h-16 pl-16 rounded-2xl bg-white/10 border-white/5 font-black text-sm uppercase tracking-widest" placeholder="30" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 text-primary">Precio Estimado ($)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                                <Input name="price" type="number" step="0.01" defaultValue={editingService?.price} required className="h-16 pl-16 rounded-2xl bg-white/10 border-white/5 font-black text-sm uppercase tracking-widest" placeholder="1500" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 text-primary">Descripción</Label>
                            <textarea 
                                name="description" 
                                defaultValue={editingService?.description} 
                                className="w-full h-32 rounded-3xl bg-white/10 border-white/5 p-6 font-bold text-xs uppercase tracking-widest focus:ring-1 focus:ring-primary/20 transition-all outline-none" 
                                placeholder="DETALLES ADICIONALES..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-10 pt-6 bg-slate-50/50 dark:bg-white/5 border-t border-primary/5 sm:justify-center">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl h-14 px-8 font-black text-[10px] uppercase tracking-widest opacity-40">Cancelar</Button>
                        <Button type="submit" disabled={isLoading} className="rounded-2xl h-14 px-12 bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20">
                            {isLoading ? 'GUARDANDO...' : 'GUARDAR SERVICIO'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
