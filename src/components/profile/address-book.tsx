'use client';

import React, { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { UserAddress } from '@/types/data';
import { MapLocationPicker } from '@/components/ui/map-location-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Home, Briefcase, MapPin, Plus, Trash2, Check, Loader2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function AddressBook() {
    const { user, userData: profile } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [isAdding, setIsAdding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newAddress, setNewAddress] = useState<Partial<UserAddress>>({
        label: '',
        notes: ''
    });

    const handleAddAddress = async () => {
        if (!user || !newAddress.address || !newAddress.label) {
            toast({ title: "Completa los campos", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const addressObj: UserAddress = {
                id: crypto.randomUUID(),
                label: newAddress.label,
                address: newAddress.address!,
                lat: newAddress.lat,
                lng: newAddress.lng,
                notes: newAddress.notes || '',
                isDefault: (profile?.addresses?.length || 0) === 0
            };

            await updateDoc(doc(firestore, 'users', user.uid), {
                addresses: arrayUnion(addressObj)
            });

            toast({ title: "🏠 Dirección guardada", description: `"${addressObj.label}" agregada correctamente.` });
            setIsAdding(false);
            setNewAddress({ label: '', notes: '' });
        } catch (error) {
            console.error(error);
            toast({ title: "Error al guardar", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (addr: UserAddress) => {
        if (!user) return;
        try {
            await updateDoc(doc(firestore, 'users', user.uid), {
                addresses: arrayRemove(addr)
            });
            toast({ title: "Dirección eliminada" });
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    return (
        <Card className="glass glass-dark shadow-premium border-0 rounded-[2rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-xl font-black tracking-tight uppercase text-xs text-foreground/80 tracking-[0.2em]">Mis Direcciones</CardTitle>
                </div>
                {!isAdding && (
                    <Button 
                        onClick={() => setIsAdding(true)} 
                        size="sm" 
                        className="h-9 px-4 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                    >
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> AGREGAR
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <AnimatePresence mode="wait">
                    {isAdding ? (
                        <motion.div 
                            key="form"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            <div className="space-y-4">
                                <MapLocationPicker 
                                    onLocationSelect={(loc) => setNewAddress(prev => ({ ...prev, address: loc.address, lat: loc.lat, lng: loc.lng }))}
                                    className="h-[250px]"
                                />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground ml-1">Etiqueta</Label>
                                        <Input 
                                            placeholder="Ej: Mi Casa, Trabajo" 
                                            value={newAddress.label}
                                            onChange={e => setNewAddress({...newAddress, label: e.target.value})}
                                            className="h-12 bg-background/50 border-white/5 rounded-xl font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground ml-1">Referencias</Label>
                                        <Input 
                                            placeholder="Ej: Portón negro, timbre fuerte" 
                                            value={newAddress.notes}
                                            onChange={e => setNewAddress({...newAddress, notes: e.target.value})}
                                            className="h-12 bg-background/50 border-white/5 rounded-xl font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setIsAdding(false)} 
                                    className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px]"
                                >
                                    CANCELAR
                                </Button>
                                <Button 
                                    onClick={handleAddAddress}
                                    disabled={saving || !newAddress.label || !newAddress.address}
                                    className="flex-[2] h-12 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> GUARDAR DIRECCIÓN</>}
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-3"
                        >
                            {profile?.addresses && profile.addresses.length > 0 ? (
                                profile.addresses.map((addr) => (
                                    <div key={addr.id} className="p-4 rounded-2xl bg-background/40 border border-white/5 hover:border-primary/20 transition-all group flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                {addr.label.toLowerCase().includes('casa') ? <Home className="h-5 w-5 text-primary" /> : 
                                                 addr.label.toLowerCase().includes('trabajo') ? <Briefcase className="h-5 w-5 text-primary" /> :
                                                 <MapPin className="h-5 w-5 text-primary" />}
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black uppercase tracking-tighter text-sm italic">{addr.label}</span>
                                                    {addr.isDefault && <Check className="h-3 w-3 text-green-500" />}
                                                </div>
                                                <p className="text-[10px] font-bold text-foreground truncate">{addr.address}</p>
                                                {addr.notes && (
                                                    <p className="text-[9px] font-medium text-primary italic mt-0.5 line-clamp-1">"{addr.notes}"</p>
                                                )}
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleDelete(addr)}
                                            className="h-10 w-10 rounded-xl text-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 text-center opacity-40">
                                    <MapPin className="h-10 w-10 mx-auto mb-3" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">No hay direcciones guardadas</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

