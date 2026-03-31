'use client';

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
            // A. Create Order
            const orderRef = await addDoc(collection(firestore, 'orders'), {
                userId: user.uid,
                userName: profile?.firstName ? `${profile.firstName} ${profile.lastName}` : user.displayName || 'Estudiante',
                userPhone: profile?.phone || '',
                supplierId,
                supplierName: supplierName || 'Comercio',
                items,
                subtotal,
                deliveryCost,
                serviceFee,
                totalAmount: totalWithService,
                status: 'pending_payment',
                type,
                deliveryAddress: type === 'delivery' ? address : 'Retiro en local',
                deliveryNote: note,
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
                    origin: supplierProfile?.location?.address || supplierProfile?.address,
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
            toast({ title: "Error al iniciar el pago", description: "Verifica tu conexión.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-[#0A0A0A] border-white/5 shadow-2xl rounded-[3rem] overflow-hidden">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-black italic uppercase tracking-tighter text-white">
                        <div className="h-10 w-10 rounded-xl bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
                            <ShoppingBag className="h-6 w-6 text-pink-400" />
                        </div>
                        Finalizar Pedido
                    </DialogTitle>
                    <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">
                        Review & Secure Checkout via EstuClub
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <RadioGroup value={type} onValueChange={(v: any) => setType(v)} className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                            <Label htmlFor="delivery" className="flex flex-col items-center gap-2 rounded-2xl border-2 border-white/5 bg-white/5 p-4 cursor-pointer transition-all peer-data-[state=checked]:border-pink-500/50 peer-data-[state=checked]:bg-pink-500/10">
                                <Truck className={cn("h-6 w-6", type === 'delivery' ? "text-pink-400" : "text-slate-500")} />
                                <span className="font-black text-[10px] uppercase tracking-widest">Envío</span>
                            </Label>
                        </div>
                        <div className="relative">
                            <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                            <Label htmlFor="pickup" className="flex flex-col items-center gap-2 rounded-2xl border-2 border-white/5 bg-white/5 p-4 cursor-pointer transition-all peer-data-[state=checked]:border-pink-500/50 peer-data-[state=checked]:bg-pink-500/10">
                                <ShoppingBag className={cn("h-6 w-6", type === 'pickup' ? "text-pink-400" : "text-slate-500")} />
                                <span className="font-black text-[10px] uppercase tracking-widest">Retiro</span>
                            </Label>
                        </div>
                    </RadioGroup>

                    {type === 'delivery' && (
                        <div className="space-y-3 animate-in fade-in duration-500">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Dirección de entrega</Label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-400" />
                                <Input 
                                    placeholder={calculatingLogistics ? "Calculando..." : "Calle, Altura, Ciudad..."} 
                                    className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl font-bold"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                />
                                {calculatingLogistics && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-pink-500" />}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Nota adicional</Label>
                        <Textarea className="bg-white/5 border-white/10 rounded-2xl min-h-[80px]" placeholder="Ej: Portero B, dejar en recepción..." value={note} onChange={e => setNote(e.target.value)} />
                    </div>

                    <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] space-y-4 shadow-inner glass">
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>Productos</span>
                            <span className="text-white">$ {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest h-5">
                            <span>Envío <span className="text-[9px] text-pink-500/60 lowercase italic">(Estuclub Rider)</span></span>
                            <span className={cn(deliveryCost === 0 ? "text-green-400" : "text-white", calculatingLogistics && "animate-pulse")}>
                                {calculatingLogistics ? 'Calibrando...' : (deliveryCost === 0 ? 'Gratis' : `$ ${deliveryCost.toLocaleString()}`)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <span>✨ Tarifa de Servicio</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="h-4 w-4 rounded-full bg-white/10 flex items-center justify-center cursor-help transition-transform hover:scale-110">
                                                <Info className="h-2.5 w-2.5 text-slate-400" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-slate-900 border border-white/10 text-[10px] p-4 max-w-[240px] rounded-2xl text-slate-300 shadow-2xl z-[100]">
                                            <p className="font-black uppercase tracking-widest text-pink-500 mb-1">¿Por qué este cargo?</p>
                                            Esto nos ayuda a mantener la tecnología de EstuClub, asegurar tus pagos y garantizar que los Riders tengan una app de primer nivel.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <span className="text-white">$ {serviceFee.toLocaleString()}</span>
                        </div>
                        <Separator className="bg-white/10" />
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-pink-500 mb-1">Total a pagar</p>
                                <span className={cn(
                                    "text-4xl font-black tracking-tighter text-white italic underline decoration-pink-500/30 underline-offset-4 transition-opacity",
                                    calculatingLogistics ? "opacity-50" : "opacity-100"
                                )}>
                                    $ {totalWithService.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <Badge className="bg-pink-500/10 border-pink-500/20 text-pink-400 font-black text-[9px] px-3 py-1">SECURE CHECKOUT</Badge>
                                <div className="flex items-center gap-1 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                    <CreditCard className="h-2.5 w-2.5" /> Mercado Pago
                                </div>
                            </div>
                        </div>
                    </div>

                    {!canPlaceOrder && (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3 items-center animate-in slide-in-from-bottom-2">
                            <Info className="h-5 w-5 text-amber-500 shrink-0" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-200">
                                Pago mínimo: ${supplierProfile?.minOrderAmount?.toLocaleString()} (Faltan ${(supplierProfile?.minOrderAmount || 0) - subtotal})
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-2 px-6 pb-8">
                    <div className="w-full space-y-4">
                        <Button 
                            disabled={loading || calculatingLogistics || !canPlaceOrder} 
                            onClick={handlePaymentRedirect} 
                            className="w-full h-20 bg-pink-500 text-black font-black text-2xl uppercase tracking-[0.2em] rounded-[2rem] hover:bg-white transition-all shadow-[0_15px_40px_rgba(236,72,153,0.3)] relative group overflow-hidden border-none"
                        >
                            {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                                <div className="flex items-center gap-4">
                                    PAGAR
                                    <Sparkles className="h-6 w-6 animate-pulse" />
                                </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                        </Button>
                        <div className="flex items-center justify-center gap-2 opacity-50">
                            <ShieldCheck className="h-3 w-3 text-green-500" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Protección al Estudiante EstuClub</span>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
