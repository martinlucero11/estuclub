'use client';
// Estuclub Premium Build: 2026-03-31 (v2.0.1)

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/cart-context';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { addDoc, collection, doc, serverTimestamp, Timestamp, updateDoc, arrayUnion } from 'firebase/firestore';
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
import { Loader2, MapPin, Truck, ShoppingBag, CreditCard, Sparkles, Info, ShieldCheck, Home, Briefcase, Plus, Save } from 'lucide-react';
import { getLiveShippingRate } from '@/lib/shipping';
import { Separator } from '@/components/ui/separator';
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
    const [shippingDetails, setShippingDetails] = useState<{ rate: number, distance: number } | null>(null);

    // ── INITIAL ADDRESS LOGIC ─────────────────────────────
    useEffect(() => {
        if (profile?.addresses && profile.addresses.length > 0) {
            const defaultAddr = profile.addresses.find(a => a.isDefault) || profile.addresses[0];
            setSelectedAddressId(defaultAddr.id);
            setAddress(defaultAddr.address);
        } else if (profile?.location?.address) {
            setAddress(profile.location.address);
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
                const result = await getLiveShippingRate(origin, address);
                if (result.success) {
                    setShippingDetails({ rate: result.rate, distance: result.distanceKm });
                }
            } catch (error) {
                console.error("Logistics calculation failed", error);
            } finally {
                setCalculatingLogistics(false);
            }
        };

        const timer = setTimeout(calculateShipping, 800);
        return () => clearTimeout(timer);
    }, [address, type, supplierProfile]);

    const deliveryCost = type === 'delivery' ? (shippingDetails?.rate || 0) : 0;
    // Fee is 5% of (Subtotal + Delivery)
    const serviceFee = Math.round((subtotal + deliveryCost) * SERVICE_FEE_PERCENTAGE);
    // User pays Subtotal + Service Fee online
    const totalPaidOnline = subtotal + serviceFee;
    // User pays Delivery Cost at door
    const totalAtDoor = deliveryCost;
    
    const canPlaceOrder = subtotal >= (supplierProfile?.minOrderAmount || 0);

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

        setLoading(true);
        try {
            const currentLabel = profile?.addresses?.find(a => a.id === selectedAddressId)?.label || addressLabel || 'Manual';

            const orderRef = await addDoc(collection(firestore, 'orders'), {
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
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderRef.id,
                    items,
                    supplierId,
                    totalSubtotal: subtotal,
                    origin: supplierProfile?.location?.address || supplierProfile?.address || '',
                    destination: address,
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
            toast({ title: "Error en el pago", variant: "destructive" });
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
                        <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Confirmar Pedido</DialogTitle>
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
                            {profile?.addresses && profile.addresses.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">Tus Direcciones</Label>
                                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                        {profile.addresses.map((addr) => {
                                            const isSelected = selectedAddressId === addr.id;
                                            return (
                                                <Button
                                                    key={addr.id}
                                                    variant="outline"
                                                    onClick={() => { setSelectedAddressId(addr.id); setAddress(addr.address); }}
                                                    className={cn(
                                                        "h-10 px-4 rounded-xl border-slate-100 flex items-center gap-2 transition-all shrink-0",
                                                        isSelected ? "bg-pink-50 border-estuclub-rosa/20 text-estuclub-rosa" : "bg-white text-slate-500 opacity-60"
                                                    )}
                                                >
                                                    {addr.label.toLowerCase().includes('casa') ? <Home className="h-3.5 w-3.5" /> : <Briefcase className="h-3.5 w-3.5" />}
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{addr.label}</span>
                                                </Button>
                                            );
                                        })}
                                        <Button
                                            variant="outline"
                                            onClick={() => { setSelectedAddressId(null); setAddress(''); }}
                                            className={cn(
                                                "h-10 w-10 p-0 rounded-xl border-slate-100 flex items-center justify-center shrink-0",
                                                !selectedAddressId ? "bg-pink-50 border-estuclub-rosa/20 text-estuclub-rosa" : "bg-white text-slate-400"
                                            )}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Manual Address Input */}
                            <div className="space-y-1.5">
                                <Label className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">Dirección de Entrega</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-estuclub-rosa" />
                                    <Input 
                                        placeholder={calculatingLogistics ? "Calculando distancia..." : "Calle, Altura..."} 
                                        className="h-12 pl-10 text-sm bg-slate-50 border-slate-100 rounded-xl font-bold italic text-slate-900 placeholder:text-slate-300 focus:bg-white transition-all shadow-sm"
                                        value={address}
                                        onChange={e => { setAddress(e.target.value); setSelectedAddressId(null); }}
                                    />
                                    {calculatingLogistics && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-estuclub-rosa" />}
                                </div>
                            </div>

                            {/* Save New Address Option */}
                            {!selectedAddressId && address.length > 5 && (
                                <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2 border border-slate-100 animate-in fade-in duration-500">
                                    <Input 
                                        placeholder="Etiqueta (ej. Facu)" 
                                        className="h-8 text-[10px] uppercase font-black tracking-widest bg-white border-slate-100 rounded-lg flex-1"
                                        value={addressLabel}
                                        onChange={e => setAddressLabel(e.target.value)}
                                    />
                                    <Button 
                                        size="sm" 
                                        onClick={handleSaveAddress}
                                        disabled={isSavingAddress}
                                        className="bg-estuclub-rosa hover:bg-estuclub-rosa text-white font-black text-[9px] uppercase tracking-widest rounded-lg h-8 border-none"
                                    >
                                        {isSavingAddress ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Save className="mr-1 h-3 w-3" /> Guardar</>}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">Nota para el Rider</Label>
                        <Input className="h-11 text-sm bg-slate-50 border-slate-100 rounded-xl text-slate-900 font-bold placeholder:text-slate-300 focus:bg-white transition-all px-4" placeholder="Ej: Portero 5B / Esquina roja" value={note} onChange={e => setNote(e.target.value)} />
                    </div>

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
