'use client';
// Estuclub Premium Build: 2026-03-31 (v2.0.1)

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/cart-context';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { collection, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { SupplierProfile } from '@/types/data';
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
import { Loader2, MapPin, Truck, ShoppingBag, CreditCard, Sparkles, Info, ShieldCheck } from 'lucide-react';
import { getLiveShippingRate } from '@/lib/shipping';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
    Tooltip, 
    TooltipContent, 
    TooltipProvider, 
    TooltipTrigger 
} from '@/components/ui/tooltip';

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
    const [type, setType] = useState<'delivery' | 'pickup'>('delivery');
    const [address, setAddress] = useState(profile?.location?.address || '');
    const [note, setNote] = useState('');
    const [shippingDetails, setShippingDetails] = useState<{ rate: number, distance: number } | null>(null);

    // Auto-fill address from user profile when it loads
    useEffect(() => {
        if (profile?.location?.address && !address) {
            setAddress(profile.location.address);
        }
    }, [profile]);

    // Fetch supplier settings
    const supplierRef = supplierId ? doc(firestore, 'roles_supplier', supplierId) : null;
    const { data: supplierProfile } = useDoc<SupplierProfile>(supplierRef);

    // 1. Calculate Shipping in Real-Time
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
    const serviceFee = Math.round((subtotal + deliveryCost) * SERVICE_FEE_PERCENTAGE);
    const totalWithService = subtotal + deliveryCost + serviceFee;
    const canPlaceOrder = subtotal >= (supplierProfile?.minOrderAmount || 0);

    const handlePaymentRedirect = async () => {
        if (!firestore || !user || !supplierId) return;
        if (type === 'delivery' && !address) {
            toast({ title: "Dirección requerida", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            // A. Create Order (Safely check for undefined to prevent Firebase crashes)
            const orderRef = await addDoc(collection(firestore, 'orders'), {
                userId: user.uid,
                userName: profile?.firstName ? `${profile.firstName} ${profile.lastName}` : user.displayName || 'Estudiante EstuClub',
                userPhone: profile?.phone || '',
                supplierId,
                supplierName: supplierName || 'Commerce',
                items: items.map(i => ({ ...i })), // Deep copy to avoid proxy issues
                subtotal: Math.round(subtotal),
                deliveryCost: Math.round(deliveryCost),
                serviceFee: Math.round(serviceFee),
                totalAmount: Math.round(totalWithService),
                status: 'pending_payment',
                type,
                deliveryAddress: type === 'delivery' ? (address || 'No especificada') : 'Retiro en local',
                deliveryNote: note || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // B. Call Checkout API
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
                throw new Error("Payment initialization failed");
            }
        } catch (error) {
            console.error(error);
            toast({ 
                title: "Error al iniciar el pago", 
                description: "Verifica tu conexión u orden.", 
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast({ title: "GPS no disponible", description: "Tu navegador no soporta geolocalización." });
            return;
        }

        setCalculatingLogistics(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                // Since reverse geocoding requires a server-side API call for keys,
                // we'll at least put the coordinates if we don't have a label.
                setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                setCalculatingLogistics(false);
                toast({ title: "Ubicación obtenida", description: "Hemos fijado tus coordenadas." });
            },
            (error) => {
                setCalculatingLogistics(false);
                toast({ title: "Error de GPS", description: "No pudimos obtener tu ubicación.", variant: "destructive" });
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto bg-white border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-[2rem] p-0 selection:bg-pink-100">
                <DialogHeader className="px-5 pt-5 pb-2 flex flex-row items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-pink-50 flex items-center justify-center border border-pink-100 shrink-0">
                        <ShoppingBag className="h-4 w-4 text-pink-500" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Check Out</DialogTitle>
                        <DialogDescription className="font-bold text-slate-400 uppercase tracking-[0.15em] text-[8px]">Secure Logistics ✨</DialogDescription>
                    </div>
                </DialogHeader>

                <div className="space-y-3 px-5 pb-3">
                    <RadioGroup value={type} onValueChange={(v: any) => setType(v)} className="grid grid-cols-2 gap-2">
                        <div className="relative">
                            <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                            <Label htmlFor="delivery" className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-50 bg-slate-50 p-2.5 cursor-pointer transition-all peer-data-[state=checked]:border-pink-500/20 peer-data-[state=checked]:bg-white peer-data-[state=checked]:shadow-sm">
                                <Truck className={cn("h-4 w-4", type === 'delivery' ? "text-pink-500" : "text-slate-300")} />
                                <span className={cn("font-black text-[9px] uppercase tracking-widest", type === 'delivery' ? "text-slate-900" : "text-slate-400")}>Envío</span>
                            </Label>
                        </div>
                        <div className="relative">
                            <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                            <Label htmlFor="pickup" className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-50 bg-slate-50 p-2.5 cursor-pointer transition-all peer-data-[state=checked]:border-pink-500/20 peer-data-[state=checked]:bg-white peer-data-[state=checked]:shadow-sm">
                                <ShoppingBag className={cn("h-4 w-4", type === 'pickup' ? "text-pink-500" : "text-slate-300")} />
                                <span className={cn("font-black text-[9px] uppercase tracking-widest", type === 'pickup' ? "text-slate-900" : "text-slate-400")}>Retiro</span>
                            </Label>
                        </div>
                    </RadioGroup>

                    {type === 'delivery' && (
                        <div className="space-y-1.5 animate-in slide-in-from-bottom-1 duration-200">
                            <div className="flex justify-between items-center px-0.5">
                                <Label className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">Dirección</Label>
                                <button onClick={handleGetCurrentLocation} className="text-[8px] font-black uppercase tracking-widest text-pink-500 hover:text-pink-600 flex items-center gap-1 transition-colors">
                                    <MapPin className="h-2.5 w-2.5" /> GPS
                                </button>
                            </div>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-pink-500" />
                                <Input 
                                    placeholder={calculatingLogistics ? "Sincronizando..." : "Calle, Altura..."} 
                                    className="h-10 pl-9 text-sm bg-slate-50 border-slate-100 rounded-lg font-bold italic text-slate-900 placeholder:text-slate-300 focus:bg-white transition-all"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                />
                                {calculatingLogistics && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-pink-500" />}
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400 px-0.5">Nota</Label>
                        <Input className="h-10 text-sm bg-slate-50 border-slate-100 rounded-lg text-slate-900 font-bold placeholder:text-slate-300 focus:bg-white transition-all px-3" placeholder="Ej: Portero A..." value={note} onChange={e => setNote(e.target.value)} />
                    </div>

                    <div className="bg-white border border-pink-100 p-4 rounded-xl space-y-2.5">
                        <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Productos</span>
                            <span className="text-slate-900">$ {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Envío</span>
                            <span className={cn("font-black", deliveryCost === 0 ? "text-green-500" : "text-slate-900", calculatingLogistics && "animate-pulse")}>
                                {calculatingLogistics ? '...' : (deliveryCost === 0 ? 'BONIFICADO' : `$ ${deliveryCost.toLocaleString()}`)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <span>✨ EstuClub</span>
                            <span className="text-slate-900">$ {serviceFee.toLocaleString()}</span>
                        </div>
                        <Separator className="bg-pink-50" />
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-[0.15em] text-pink-500 italic">Total</p>
                                <span className={cn(
                                    "text-2xl font-black tracking-tighter text-slate-900 italic transition-all duration-300",
                                    calculatingLogistics ? "opacity-20" : "opacity-100"
                                )}>
                                    $ {totalWithService.toLocaleString()}
                                </span>
                            </div>
                            <Badge className="bg-white border-pink-100 text-pink-500 font-black text-[7px] px-2 py-0.5">ESTU PRO</Badge>
                        </div>
                    </div>

                    {!canPlaceOrder && (
                        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100 flex gap-2 items-center">
                            <Info className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <p className="text-[8px] font-bold text-amber-900/70">
                                Mínimo: <span className="font-black">${supplierProfile?.minOrderAmount?.toLocaleString()}</span>
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-5 pb-5 pt-3 flex flex-col gap-2 sm:flex-col items-stretch border-t border-slate-100">
                    <Button 
                        disabled={loading || calculatingLogistics || !canPlaceOrder} 
                        onClick={handlePaymentRedirect} 
                        className="w-full h-14 bg-pink-500 hover:bg-pink-600 text-white font-black text-lg uppercase tracking-wider italic rounded-2xl shadow-md transition-all active:scale-95 border-none"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "PAGAR ✨"}
                    </Button>
                    <div className="flex items-center justify-center gap-2 opacity-30">
                        <ShieldCheck className="h-3 w-3 text-slate-900" />
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-900">Seguro EstuClub</span>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
