'use client';
// Estuclub Premium Build: 2026-03-31 (v2.0.1)

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/cart-context';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { addDoc, collection, doc, serverTimestamp, Timestamp, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { SupplierProfile, UserAddress } from '@/types/data';
import { cn } from '@/lib/utils';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Truck, ShoppingBag, CreditCard, Sparkles, Info, ShieldCheck, Home, Briefcase, Plus, Save, Target, ChevronDown, Timer } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { MapLocationPicker } from '@/components/ui/map-location-picker';
import { Badge } from '@/components/ui/badge';

interface CheckoutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const SERVICE_FEE_PERCENTAGE = 0.05;

export function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
    const { items, subtotal, supplierId, supplierName, clearCart } = useCart();
    const { user, userData: profile } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [calculatingLogistics, setCalculatingLogistics] = useState(false);
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [type, setType] = useState<'delivery' | 'pickup'>('delivery');
    const [address, setAddress] = useState('');
    const [addressLabel, setAddressLabel] = useState('');
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [note, setNote] = useState('');
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [shippingDetails, setShippingDetails] = useState<{ rate: number, distance: number } | null>(null);

    // ── INITIAL ADDRESS LOGIC ─────────────────────────────
    useEffect(() => {
        if (profile?.addresses && profile.addresses.length > 0) {
            const defaultAddr = profile.addresses.find(a => a.isDefault) || profile.addresses[0];
            setSelectedAddressId(defaultAddr.id);
            setAddress(defaultAddr.address);
            if (defaultAddr.notes) setNote(defaultAddr.notes);
            setIsAddingNew(false);
        } else {
            setIsAddingNew(true);
        }
    }, [profile, open]);

    // Fetch supplier settings
    const supplierRef = supplierId ? doc(firestore, 'roles_supplier', supplierId) : null;
    const { data: supplierProfile } = useDoc<SupplierProfile>(supplierRef);

    // ── SHIPPING CALCULATION ──────────────────────────────
    useEffect(() => {
        const calculateShipping = async () => {
            if (type !== 'delivery' || !address || address.length < 5 || !supplierProfile) {
                setShippingDetails(null);
                return;
            }

            setCalculatingLogistics(true);
            try {
                const origin = supplierProfile.location?.address || supplierProfile.address || '';
                
                const response = await fetch('/api/shipping/calculate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ origin, destination: address })
                });

                if (!response.ok) throw new Error("API Route failure");
                
                const result = await response.json();
                if (result.success) {
                    setShippingDetails({ rate: result.rate, distance: result.distanceKm });
                }
            } catch (error) {
                console.error("Logistics calculation failed", error);
                // Fallback a tarifa base en caso de error crítico
                setShippingDetails({ rate: 1400, distance: 0 });
            } finally {
                setCalculatingLogistics(false);
            }
        };

        const timer = setTimeout(calculateShipping, 1500); // 1500ms debounce (BUG-09 fix)
        return () => clearTimeout(timer);
    }, [address, type, supplierProfile]);

    const deliveryCost = type === 'delivery' ? (shippingDetails?.rate || 0) : 0;
    const serviceFee = Math.round(subtotal * SERVICE_FEE_PERCENTAGE);
    const totalPaidOnline = subtotal + serviceFee;
    const totalAtDoor = deliveryCost;
    
    const isNoteMissing = type === 'delivery' && address.length > 0 && note.trim().length < 3;
    const canPlaceOrder = subtotal >= (supplierProfile?.minOrderAmount || 0) && (!isNoteMissing);

    // ── ACTIONS ───────────────────────────────────────────
    const handleSaveAddress = async () => {
        if (!user || !address || isSavingAddress) return;
        setIsSavingAddress(true);
        try {
            const newAddress: UserAddress = {
                id: crypto.randomUUID(),
                label: addressLabel || 'Dirección',
                address,
                isDefault: (profile?.addresses?.length || 0) === 0
            };
            await updateDoc(doc(firestore, 'users', user.uid), {
                addresses: arrayUnion(newAddress)
            });
            toast({ title: "🏠 Dirección Guardada", description: `"${newAddress.label}" agregada a tu perfil.` });
            setSelectedAddressId(newAddress.id);
            setAddressLabel('');
        } catch (error) {
            toast({ title: "Error al guardar", variant: "destructive" });
        } finally {
            setIsSavingAddress(false);
        }
    };

    const handlePaymentRedirect = async () => {
        if (!firestore || !user || !supplierId) return;
        if (type === 'delivery' && !address) {
            toast({ title: "Dirección requerida", variant: "destructive" });
            return;
        }
        if (isNoteMissing) {
            toast({ title: "Referencias obligatorias", description: "Por favor, indica piso, depto o descripción de la casa.", variant: "destructive" });
            return;
        }

        setLoading(true);
        let orderRef = null;
        try {
            const currentLabel = profile?.addresses?.find(a => a.id === selectedAddressId)?.label || addressLabel || 'Manual';

            const deliveryPin = Math.floor(1000 + Math.random() * 9000).toString();

            orderRef = await addDoc(collection(firestore, 'orders'), {
                userId: user.uid,
                userName: profile?.firstName ? `${profile.firstName} ${profile.lastName}` : user.displayName || 'EstuClub User',
                userPhone: profile?.phone || '',
                supplierId,
                supplierName: supplierName || 'Commerce',
                items: items.map(i => ({ ...i })),
                
                // NEW STRUCTURE for Door Payment
                itemsTotal: Math.round(subtotal),
                serviceFee: Math.round(serviceFee),
                totalPaidOnline: Math.round(totalPaidOnline),
                deliveryFee: Math.round(deliveryCost),
                deliveryPaymentStatus: 'pending',

                subtotal: Math.round(subtotal), // legacy support
                deliveryCost: Math.round(deliveryCost), // legacy support
                totalAmount: Math.round(totalPaidOnline + deliveryCost), // legacy support
                
                status: 'pending_payment',
                type,
                deliveryAddress: type === 'delivery' ? address : 'Retiro en local',
                deliveryAddressLabel: type === 'delivery' ? currentLabel : '',
                deliveryNote: note || '',
                deliveryPin,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            const idToken = await user.getIdToken();

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    orderId: orderRef.id,
                })
            });

            const data = await response.json();
            if (data.init_point) {
                clearCart();
                window.location.href = data.init_point;
            } else {
                throw new Error("Payment init failed");
            }
        } catch (error) {
            console.error("Payment initiation failed:", error);
            if (orderRef) {
                try {
                    await deleteDoc(orderRef);
                    // Orphaned order deleted: orderRef.id
                } catch (delError) {
                    console.error("Failed to delete orphaned order:", delError);
                }
            }
            toast({ 
                title: "Error en la pasarela", 
                description: "No se pudo iniciar el pago. Por favor, intenta de nuevo.",
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto bg-white border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-[2rem] p-0 selection:bg-pink-100">
                <DialogHeader className="px-6 pt-6 pb-2 flex flex-row items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center border border-pink-100 shrink-0">
                        <ShoppingBag className="h-5 w-5 text-estuclub-rosa" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Confirmar Pedido</DialogTitle>
                            {supplierProfile?.avgPrepTime && (
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0">
                                    <Timer className="h-3 w-3" />
                                    {supplierProfile.avgPrepTime} MIN
                                </Badge>
                            )}
                        </div>
                        <DialogDescription className="font-bold text-slate-400 uppercase tracking-[0.15em] text-[8px]">Logística Segura Estuclub ✨</DialogDescription>
                    </div>
                </DialogHeader>

                <div className="space-y-4 px-6 pb-4">
                    {/* Mode Selector */}
                    <RadioGroup value={type} onValueChange={(v: any) => setType(v)} className="grid grid-cols-2 gap-2">
                        <div className="relative">
                            <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                            <Label htmlFor="delivery" className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-50 bg-slate-50 p-3 cursor-pointer transition-all peer-data-[state=checked]:border-estuclub-rosa/20 peer-data-[state=checked]:bg-white peer-data-[state=checked]:shadow-sm">
                                <Truck className={cn("h-4 w-4", type === 'delivery' ? "text-estuclub-rosa" : "text-slate-300")} />
                                <span className={cn("font-black text-[10px] uppercase tracking-widest", type === 'delivery' ? "text-slate-900" : "text-slate-400")}>Envío</span>
                            </Label>
                        </div>
                        <div className="relative">
                            <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                            <Label htmlFor="pickup" className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-50 bg-slate-50 p-3 cursor-pointer transition-all peer-data-[state=checked]:border-estuclub-rosa/20 peer-data-[state=checked]:bg-white peer-data-[state=checked]:shadow-sm">
                                <ShoppingBag className={cn("h-4 w-4", type === 'pickup' ? "text-estuclub-rosa" : "text-slate-300")} />
                                <span className={cn("font-black text-[10px] uppercase tracking-widest", type === 'pickup' ? "text-slate-900" : "text-slate-400")}>Retiro</span>
                            </Label>
                        </div>
                    </RadioGroup>

                    {type === 'delivery' && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                            {/* Saved Addresses List */}
                            {profile?.addresses && profile.addresses.length > 0 && !isAddingNew && (
                                <div className="space-y-2">
                                    <Label className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">Tus Direcciones</Label>
                                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                        {profile.addresses.map((addr) => {
                                            const isSelected = selectedAddressId === addr.id;
                                            return (
                                                <Button
                                                    key={addr.id}
                                                    variant="outline"
                                                    onClick={() => { 
                                                        setSelectedAddressId(addr.id); 
                                                        setAddress(addr.address);
                                                        setNote(addr.notes || '');
                                                    }}
                                                    className={cn(
                                                        "h-10 px-4 rounded-xl border-slate-100 flex items-center gap-2 transition-all shrink-0",
                                                        isSelected ? "bg-pink-50 border-estuclub-rosa/20 text-estuclub-rosa" : "bg-white text-slate-500"
                                                    )}
                                                >
                                                    {addr.label.toLowerCase().includes('casa') ? <Home className="h-3.5 w-3.5" /> : <Briefcase className="h-3.5 w-3.5" />}
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{addr.label}</span>
                                                </Button>
                                            );
                                        })}
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsAddingNew(true)}
                                            className="h-10 w-10 p-0 rounded-xl border-slate-100 flex items-center justify-center shrink-0 bg-white text-slate-400"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {isAddingNew && (
                                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">Nueva Ubicación</Label>
                                        {profile?.addresses && profile.addresses.length > 0 && (
                                            <Button variant="ghost" size="sm" onClick={() => setIsAddingNew(false)} className="h-6 text-[8px] font-black uppercase text-slate-400 hover:text-primary transition-colors">
                                                VOLVER A MIS DIRECCIONES
                                            </Button>
                                        )}
                                    </div>
                                    <MapLocationPicker 
                                        onLocationSelect={(loc) => {
                                            setAddress(loc.address);
                                            setSelectedAddressId(null);
                                        }}
                                        className="h-[200px]"
                                    />
                                </div>
                            )}

                            {/* Referencias (Mandatory for Delivery) */}
                            <div className="space-y-1.5">
                                <Label className={cn(
                                    "text-[8px] font-black uppercase tracking-[0.15em] flex items-center gap-1",
                                    isNoteMissing ? "text-primary" : "text-slate-400"
                                )}>
                                    Piso / Depto / Referencias {isNoteMissing && <span className="text-[7px] animate-pulse">(OBILIGATORIO)</span>}
                                </Label>
                                <div className="relative group/input">
                                    <Target className={cn(
                                        "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                                        isNoteMissing ? "text-primary" : "text-slate-300 group-focus-within/input:text-primary"
                                    )} />
                                    <Input 
                                        className={cn(
                                            "h-12 pl-12 text-sm bg-slate-50 border-slate-100 rounded-xl font-bold placeholder:text-slate-300 focus:bg-white transition-all shadow-sm",
                                            isNoteMissing && "border-primary/20 bg-primary/5"
                                        )}
                                        placeholder="Ej: Piso 2 B / Rejas blancas" 
                                        value={note} 
                                        onChange={e => setNote(e.target.value)} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Summary */}
                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            <span>Subtotal Comida</span>
                            <span className="text-slate-900">$ {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            <span>Tarifa de Servicio (5%)</span>
                            <span className="text-slate-900">$ {serviceFee.toLocaleString()}</span>
                        </div>
                        <Separator className="bg-slate-200" />
                        
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-900">Total a Pagar Ahora</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase">Procesado por Mercado Pago</p>
                            </div>
                            <span className="text-xl font-black tracking-tighter text-slate-900">$ {totalPaidOnline.toLocaleString()}</span>
                        </div>

                        {type === 'delivery' && (
                            <div className="mt-4 p-4 rounded-xl bg-[#d93b64]/5 border border-[#d93b64]/20 flex justify-between items-center animate-pulse">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#d93b64]">🛵 ENVÍO AL REPARTIDOR</p>
                                    <p className="text-[8px] font-bold text-[#d93b64]/60 uppercase">Pagar en mano al recibir</p>
                                </div>
                                <span className="text-xl font-black tracking-tighter text-[#d93b64]">$ {deliveryCost.toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    {!canPlaceOrder && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-500/20 flex gap-3 items-center">
                            <Info className="h-4 w-4 text-amber-500 shrink-0" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 leading-tight">
                                Mínimo de compra:<br/><span className="text-sm tracking-tighter">${supplierProfile?.minOrderAmount?.toLocaleString()}</span>
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 pb-6 pt-2 flex flex-col gap-3 sm:flex-col items-stretch border-none">
                    <Button 
                        disabled={loading || calculatingLogistics || !canPlaceOrder || (type === 'delivery' && !address)} 
                        onClick={handlePaymentRedirect} 
                        className="w-full h-15 bg-estuclub-rosa hover:bg-estuclub-rosa text-white font-black text-xl uppercase tracking-widest italic rounded-[1.25rem] shadow-xl shadow-estuclub-rosa/20 hover:scale-[1.02] active:scale-95 transition-all border-none"
                    >
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "CONFIRMAR PAGO 🚀"}
                    </Button>
                    <div className="flex items-center justify-center gap-2 opacity-40">
                        <ShieldCheck className="h-3.5 w-3.5 text-slate-900" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Pasarela Protegida</span>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
