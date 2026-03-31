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
            <DialogContent className="sm:max-w-[450px] bg-white border-slate-100 shadow-[0_30px_90px_rgba(0,0,0,0.1)] rounded-[3.5rem] overflow-hidden p-0 selection:bg-pink-100">
                <DialogHeader className="p-10 pb-2 flex flex-col gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-[2rem] bg-pink-50 flex items-center justify-center border border-pink-100 shadow-sm">
                            <ShoppingBag className="h-8 w-8 text-pink-500" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Check Out</DialogTitle>
                            <DialogDescription className="font-black text-slate-400 uppercase tracking-[0.3em] text-[10px]">
                                EstuClub Secure Logistics
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-8 px-10 py-6">
                    <RadioGroup value={type} onValueChange={(v: any) => setType(v)} className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                            <Label htmlFor="delivery" className="flex flex-col items-center gap-3 rounded-[2rem] border-2 border-slate-50 bg-slate-50 p-6 cursor-pointer transition-all peer-data-[state=checked]:border-pink-500/20 peer-data-[state=checked]:bg-white peer-data-[state=checked]:shadow-[0_15px_30px_rgba(219,39,119,0.08)]">
                                <Truck className={cn("h-8 w-8", type === 'delivery' ? "text-pink-500" : "text-slate-300")} />
                                <span className={cn("font-black text-[11px] uppercase tracking-widest", type === 'delivery' ? "text-slate-900" : "text-slate-400")}>Envío</span>
                            </Label>
                        </div>
                        <div className="relative">
                            <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                            <Label htmlFor="pickup" className="flex flex-col items-center gap-3 rounded-[2rem] border-2 border-slate-50 bg-slate-50 p-6 cursor-pointer transition-all peer-data-[state=checked]:border-pink-500/20 peer-data-[state=checked]:bg-white peer-data-[state=checked]:shadow-[0_15px_30px_rgba(219,39,119,0.08)]">
                                <ShoppingBag className={cn("h-8 w-8", type === 'pickup' ? "text-pink-500" : "text-slate-300")} />
                                <span className={cn("font-black text-[11px] uppercase tracking-widest", type === 'pickup' ? "text-slate-900" : "text-slate-400")}>Retiro</span>
                            </Label>
                        </div>
                    </RadioGroup>

                    {type === 'delivery' && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-500">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1 italic">Dirección de Entrega</Label>
                            <div className="relative group">
                                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-pink-500 transition-transform group-focus-within:scale-110" />
                                <Input 
                                    placeholder={calculatingLogistics ? "Sincronizando..." : "Calle, Altura, Ciudad..."} 
                                    className="h-16 pl-14 bg-slate-50 border-slate-100 rounded-2xl font-black italic tracking-tight text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-pink-200 transition-all shadow-inner"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                />
                                {calculatingLogistics && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-pink-500" />}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1 italic">Nota Estudiantil</Label>
                        <Textarea className="bg-slate-50 border-slate-100 rounded-2xl min-h-[100px] text-slate-900 font-bold placeholder:text-slate-300 focus:bg-white focus:border-pink-200 transition-all resize-none p-5 shadow-inner" placeholder="Ej: Piso 4, B. Tocar timbre..." value={note} onChange={e => setNote(e.target.value)} />
                    </div>

                    <div className="bg-white border-2 border-pink-50 p-8 rounded-[2.5rem] space-y-5 shadow-[0_20px_40px_rgba(219,39,119,0.04)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] rotate-12">
                            <Sparkles className="h-24 w-24 text-pink-500" />
                        </div>
                        
                        <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            <span>Subtotal Productos</span>
                            <span className="text-slate-900">$ {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest h-6 leading-none">
                            <span>Servicio Logístico <span className="text-[9px] text-pink-500 lowercase italic ml-1 tracking-tight"> (Rider pro)</span></span>
                            <span className={cn("font-black", deliveryCost === 0 ? "text-green-500" : "text-slate-900", calculatingLogistics && "animate-pulse opacity-50")}>
                                {calculatingLogistics ? 'Calculando...' : (deliveryCost === 0 ? 'BONIFICADO' : `$ ${deliveryCost.toLocaleString()}`)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            <div className="flex items-center gap-2">
                                <span>✨ Tarifa EstuClub</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center cursor-help transition-all hover:bg-pink-100">
                                                <Info className="h-2.5 w-2.5 text-slate-400 group-hover:text-pink-500" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-white border-pink-100 text-[11px] p-5 max-w-[260px] rounded-2xl text-slate-600 shadow-2xl z-[100] font-bold leading-relaxed">
                                            <p className="font-black uppercase tracking-widest text-pink-500 mb-2">Diferencial EstuClub</p>
                                            Esta tarifa asegura la trazabilidad de tu pedido y el soporte 24/7 de nuestro equipo.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <span className="text-slate-900">$ {serviceFee.toLocaleString()}</span>
                        </div>
                        <Separator className="bg-pink-50" />
                        <div className="flex justify-between items-end gap-4 relative z-10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500 italic">Inversión Final</p>
                                <span className={cn(
                                    "text-5xl font-black tracking-tighter text-slate-900 italic underline decoration-pink-500/20 underline-offset-8 transition-all duration-500 block",
                                    calculatingLogistics ? "opacity-20 blur-[1px]" : "opacity-100"
                                )}>
                                    $ {totalWithService.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex flex-col items-end gap-2 pb-1">
                                <Badge className="bg-white border-pink-100 text-pink-500 font-black text-[10px] px-4 py-1.5 shadow-sm">ESTU PRO</Badge>
                                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <CreditCard className="h-3 w-3" /> Mercado Pago
                                </div>
                            </div>
                        </div>
                    </div>

                    {!canPlaceOrder && (
                        <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-100 flex gap-4 items-center animate-in zoom-in-95 duration-500">
                            <Info className="h-6 w-6 text-amber-500 shrink-0" />
                            <p className="text-[11px] font-bold text-amber-900/70 leading-snug">
                                Pedido mínimo requerido: <span className="font-black text-amber-600">${supplierProfile?.minOrderAmount?.toLocaleString()}</span>. Te faltan ${(supplierProfile?.minOrderAmount || 0) - subtotal}.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-10 flex flex-col gap-6 sm:flex-col items-stretch bg-slate-50 border-t border-slate-100">
                    <Button 
                        disabled={loading || calculatingLogistics || !canPlaceOrder} 
                        onClick={handlePaymentRedirect} 
                        className="w-full h-24 bg-pink-500 hover:bg-pink-600 text-white font-black text-3xl uppercase tracking-[0.1em] italic rounded-[3rem] shadow-[0_20px_50px_-12px_rgba(236,72,153,0.4)] transition-all hover:scale-[1.01] active:scale-95 relative group overflow-hidden border-none"
                    >
                        {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                            <div className="flex items-center gap-5 relative z-10">
                                PAGAR
                                <Sparkles className="h-7 w-7 animate-pulse" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                    </Button>
                    <div className="flex items-center justify-center gap-3 opacity-30 group hover:opacity-60 transition-opacity">
                        <ShieldCheck className="h-4 w-4 text-slate-900" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">Compra Protegida EstuClub</span>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
