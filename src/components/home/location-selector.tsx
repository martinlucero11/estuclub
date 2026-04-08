'use client';

import React, { useState } from 'react';
import { MapPin, ChevronDown, Plus, Home, Briefcase, Heart, Check, Loader2, ArrowLeft, Save, Trash2, Map as MapIcon } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { MapLocationPicker } from '@/components/ui/map-location-picker';
import { Input } from '@/components/ui/input';

type SelectorView = 'list' | 'picker';

export function LocationSelector({ isIconOnly, isMinimal, variant }: { isIconOnly?: boolean, isMinimal?: boolean, variant?: 'default' | 'minimal' | 'roundPrimary' }) {
    const { userData, user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    
    // States
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<SelectorView>('list');
    const [updating, setUpdating] = useState(false);
    const [newLoc, setNewLoc] = useState<{ lat: number, lng: number, address: string, label: string }>({
        lat: -27.5852, lng: -55.4781, address: '', label: ''
    });

    const addresses = userData?.addresses || [];
    const activeAddressId = userData?.activeAddressId;
    const activeAddress = addresses.find(a => a.id === activeAddressId) || addresses.find(a => a.isDefault) || addresses[0];

    const handleSelect = async (addressId: string) => {
        if (!user || !firestore || updating) return;
        
        setUpdating(true);
        haptic.vibrateSubtle();
        try {
            await updateDoc(doc(firestore, 'users', user.uid), {
                activeAddressId: addressId
            });
            setIsOpen(false);
            toast({ title: "Ubicación actualizada", description: "Configurado para Leandro N. Alem." });
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveNew = async () => {
        if (!user || !firestore || !newLoc.label) {
            toast({ title: "Falta información", description: "Ponle un nombre a tu lugar (ej. 'Mi Casa')", variant: "destructive" });
            return;
        }

        setUpdating(true);
        haptic.vibrateImpact();
        try {
            const newId = `addr_${Date.now()}`;
            const addressObj = {
                id: newId,
                label: newLoc.label,
                address: newLoc.address,
                coords: { lat: newLoc.lat, lng: newLoc.lng },
                createdAt: new Date().toISOString()
            };

            await updateDoc(doc(firestore, 'users', user.uid), {
                addresses: arrayUnion(addressObj),
                activeAddressId: newId
            });

            toast({ title: "¡Ubicación Guardada!", description: "Ahora puedes pedir a esta dirección." });
            setIsOpen(false);
            setView('list');
        } catch (error) {
            toast({ title: "Error al guardar", variant: "destructive" });
        } finally {
            setUpdating(false);
        }
    };

    const getIcon = (label: string) => {
        const l = label?.toLowerCase() || '';
        if (l.includes('casa')) return <Home className="h-4 w-4" />;
        if (l.includes('trabajo') || l.includes('oficina')) return <Briefcase className="h-4 w-4" />;
        if (l.includes('novi')) return <Heart className="h-4 w-4" />;
        return <MapPin className="h-4 w-4" />;
    };

    if (isUserLoading) {
        return <div className="h-11 w-32 bg-white/10 animate-pulse rounded-2xl" />;
    }

    // Trigger UI
    const trigger = (
        <Button 
            variant="ghost"
            className={cn(
                "rounded-2xl transition-all hover:scale-105 active:scale-95 group",
                variant === 'roundPrimary'
                    ? "h-11 w-11 rounded-full bg-primary text-white shadow-xl hover:bg-primary/90 border-none relative overflow-hidden"
                    : isMinimal 
                        ? "h-10 w-10 p-0 bg-transparent border-none text-current opacity-70 hover:opacity-100" 
                        : cn(
                            "backdrop-blur-3xl border shadow-xl flex items-center justify-center",
                            "bg-white/40 dark:bg-black/40 border-white/40 dark:border-white/10 text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white",
                            isIconOnly ? "h-11 w-11 p-0 shrink-0" : "h-11 px-4 gap-2 w-full sm:w-auto min-w-[140px]"
                        )
            )}
        >
            <div className={cn("flex items-center shrink-0", (isIconOnly || isMinimal || variant === 'roundPrimary') ? "" : "gap-2")}>
                <div className={cn(
                    "flex items-center justify-center shrink-0",
                    variant === 'roundPrimary' ? "h-full w-full" : "h-8 w-8 bg-primary/20 rounded-lg text-primary border border-primary/20"
                )}>
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : getIcon(activeAddress?.label || 'Ubicación')}
                </div>
                {!isIconOnly && !isMinimal && variant !== 'roundPrimary' && (
                    <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]">
                        {activeAddress?.label || 'Agregar Ubicación'}
                    </span>
                )}
            </div>
            {!isIconOnly && !isMinimal && variant !== 'roundPrimary' && <ChevronDown className="ml-auto h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity" />}
        </Button>
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { 
            setIsOpen(open); 
            if (open && addresses.length === 0) setView('picker');
            else if (open) setView('list');
        }}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-md w-[94vw] sm:w-full !p-8 sm:!p-10 !rounded-[2.5rem] overflow-hidden bg-slate-50 dark:bg-neutral-900 border-none shadow-2xl animate-in zoom-in-95 duration-300">
                {view === 'list' ? (
                    <>
                        <DialogHeader className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Mis Direcciones</p>
                            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter italic font-montserrat">¿Dónde <span className="text-primary italic">estás?</span></DialogTitle>
                            <DialogDescription className="text-xs font-bold uppercase opacity-40">Selecciona tu punto de entrega en Leandro N. Alem.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                            {addresses.map((addr) => (
                                <button
                                    key={addr.id}
                                    onClick={() => handleSelect(addr.id)}
                                    className={cn(
                                        "w-full p-4 rounded-3xl border-2 flex items-center justify-between transition-all active:scale-95",
                                        activeAddressId === addr.id 
                                            ? "border-primary bg-primary/10" 
                                            : "border-white/40 dark:border-white/5 bg-white dark:bg-white/5 hover:border-primary/20"
                                    )}
                                >
                                    <div className="flex items-center gap-4 text-left overflow-hidden">
                                        <div className={cn(
                                            "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border-2",
                                            activeAddressId === addr.id ? "bg-primary text-white border-primary" : "bg-primary/5 text-primary border-primary/10"
                                        )}>
                                            {getIcon(addr.label)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">{addr.label}</p>
                                            <p className="text-[10px] font-bold opacity-40 truncate">{addr.address}</p>
                                        </div>
                                    </div>
                                    {activeAddressId === addr.id && (
                                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                                            <Check className="h-3.5 w-3.5 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <Button 
                            onClick={() => { haptic.vibrateImpact(); setView('picker'); }}
                            variant="outline"
                            className="w-full h-16 rounded-3xl border-2 border-dashed border-primary/40 text-primary font-black uppercase tracking-widest text-[11px] hover:bg-primary/5 hover:border-primary transition-all group shrink-0"
                        >
                            <Plus className="mr-2 h-4 w-4 group-hover:scale-125 transition-transform" />
                            Agregar Nueva Dirección
                        </Button>
                    </>
                ) : (
                    <div className="flex flex-col gap-6 max-h-[85vh] overflow-y-auto px-1 custom-scrollbar">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => addresses.length > 0 ? setView('list') : setIsOpen(false)}
                                className="h-10 w-10 rounded-xl bg-white/50 dark:bg-black/50"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h3 className="text-xl font-black italic uppercase italic tracking-tighter">Marcar <span className="text-primary italic">Mapa</span></h3>
                                <p className="text-[9px] font-bold uppercase opacity-40">Mueve el pin al punto de entrega.</p>
                            </div>
                        </div>

                        <div className="relative rounded-3xl overflow-hidden border-2 border-primary/20 shadow-2xl shrink-0">
                            <MapLocationPicker 
                                className="h-[300px] md:h-[350px]"
                                onLocationSelect={(l) => setNewLoc({ ...newLoc, ...l })}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-50 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                    <Check className="h-4 w-4" />
                                </div>
                                <Input 
                                    placeholder="EJ. MI CASA, FACULTAD..." 
                                    className="h-14 pl-12 rounded-2xl bg-white dark:bg-white/5 border-2 border-transparent transition-all hover:border-primary/20 focus:border-primary font-bold uppercase text-xs tracking-widest"
                                    value={newLoc.label}
                                    onChange={(e) => setNewLoc({ ...newLoc, label: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <Button 
                                onClick={handleSaveNew}
                                disabled={updating || !newLoc.label}
                                className="w-full h-16 rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl animate-in slide-in-from-bottom-4"
                            >
                                {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                    <><Save className="mr-2 h-4 w-4" /> Guardar Ubicación</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

