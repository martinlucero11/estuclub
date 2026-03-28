'use client';

import React, { useState } from 'react';
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
import { Loader2, CheckCircle2, MapPin, Truck, ShoppingBag } from 'lucide-react';

interface CheckoutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
    const { items, subtotal, supplierId, supplierName, supplierPhone, clearCart } = useCart();
    const { user, userData: profile } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [type, setType] = useState<'delivery' | 'pickup'>('delivery');
    const [address, setAddress] = useState(profile?.location?.address || '');
    const [note, setNote] = useState('');

    // Fetch supplier settings
    const supplierRef = supplierId ? doc(firestore, 'roles_supplier', supplierId) : null;
    const { data: supplierProfile } = useDoc<SupplierProfile>(supplierRef);

    const isToBeAgreed = supplierProfile?.deliveryCostType === 'to_be_agreed';
    const deliveryCost = type === 'delivery' 
        ? (isToBeAgreed ? 0 : (supplierProfile?.deliveryCost || 0)) 
        : 0;
    
    const total = subtotal + deliveryCost;
    const canPlaceOrder = subtotal >= (supplierProfile?.minOrderAmount || 0);

    const handlePlaceOrder = async () => {
        if (!firestore || !user || !supplierId) return;
        if (type === 'delivery' && !address) {
            toast({ title: "Dirección requerida", variant: "destructive" });
            return;
        }
        if (!canPlaceOrder) {
            toast({ 
                title: "Pedido mínimo no alcanzado", 
                description: `El monto mínimo para este local es $${supplierProfile?.minOrderAmount?.toLocaleString()}`,
                variant: "destructive" 
            });
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                userId: user.uid,
                userName: profile?.firstName ? `${profile.firstName} ${profile.lastName}` : user.displayName || 'Estudiante',
                userPhone: profile?.phone || '',
                supplierId,
                supplierName: supplierName || 'Comercio',
                items,
                subtotal,
                deliveryCost,
                deliveryCostType: supplierProfile?.deliveryCostType || 'free',
                totalAmount: total,
                status: 'pending',
                type,
                deliveryAddress: type === 'delivery' ? address : 'Retiro en local',
                deliveryNote: note,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(firestore, 'orders'), orderData);
            
            // --- WhatsApp Integration ---
            if (supplierPhone) {
                const itemsList = items.map(i => `• *${i.quantity}x* ${i.name} ($${(i.price * i.quantity).toLocaleString()})`).join('\n');
                
                let shippingLabel = "";
                if (type === 'delivery') {
                    if (isToBeAgreed) shippingLabel = "🚚 *Envío:* A convenir";
                    else if (deliveryCost === 0) shippingLabel = "🚚 *Envío:* Gratis";
                    else shippingLabel = `🚚 *Envío:* $${deliveryCost.toLocaleString()}`;
                } else {
                    shippingLabel = "🏪 *Retiro en local*";
                }

                const deliveryAddressInfo = type === 'delivery' ? `📍 *Dirección:* ${address}` : "";
                
                const message = `*NUEVO PEDIDO # ${docRef.id.slice(-6).toUpperCase()}*\n\n` +
                                `👤 *Cliente:* ${orderData.userName}\n` +
                                `${shippingLabel}\n` +
                                `${deliveryAddressInfo}\n\n` +
                                `🛒 *Productos:*\n${itemsList}\n\n` +
                                `💰 *Total:* ${isToBeAgreed ? `$${subtotal.toLocaleString()} + Envío` : `$${total.toLocaleString()}`}\n\n` +
                                `📝 *Nota:* ${note || 'Sin notas'}\n\n` +
                                `_Pedido enviado vía EstuClub_`;

                const whatsappUrl = `https://wa.me/${supplierPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
            }

            setSuccess(true);
            setTimeout(() => {
                clearCart();
                onOpenChange(false);
                setSuccess(false);
            }, 3000);
        } catch (error) {
            console.error(error);
            toast({ title: "Error al procesar el pedido", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[400px] text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                        <CheckCircle2 className="h-20 w-20 text-green-500 animate-bounce" />
                        <h2 className="text-2xl font-black">¡Pedido Enviado!</h2>
                        <p className="text-muted-foreground">El comercio ha recibido tu pedido y te contactará pronto.</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-primary" /> Finalizar Pedido
                    </DialogTitle>
                    <DialogDescription>
                        Revisa los detalles y confirma tu pedido para {supplierName}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <RadioGroup value={type} onValueChange={(v: any) => setType(v)} className="grid grid-cols-2 gap-4">
                        <div>
                            <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                            <Label
                                htmlFor="delivery"
                                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                                <Truck className="mb-2 h-6 w-6" />
                                <span className="font-bold">Envío</span>
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                            <Label
                                htmlFor="pickup"
                                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                                <ShoppingBag className="mb-2 h-6 w-6" />
                                <span className="font-bold">Retiro</span>
                            </Label>
                        </div>
                    </RadioGroup>

                    {type === 'delivery' && (
                        <div className="space-y-2">
                            <Label htmlFor="address">Dirección de entrega</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    id="address" 
                                    placeholder="Calle, Número, Departamento..." 
                                    className="pl-9"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="note">Nota para el comercio (opcional)</Label>
                        <Textarea 
                            id="note" 
                            placeholder="Ej: Sin cebolla, puerta roja..." 
                            value={note}
                            onChange={e => setNote(e.target.value)}
                        />
                    </div>

                    <div className="bg-muted/50 p-4 rounded-2xl space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>$ {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Envío</span>
                            <span className="font-bold">
                                {isToBeAgreed 
                                    ? 'A convenir' 
                                    : deliveryCost === 0 
                                        ? 'Gratis' 
                                        : `$ ${deliveryCost.toLocaleString()}`
                                }
                            </span>
                        </div>
                        {supplierProfile?.minOrderAmount ? (
                            <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest pt-1 border-t border-border/10">
                                <span>Pedido Mínimo</span>
                                <span className={cn(canPlaceOrder ? "text-green-500" : "text-amber-500")}>
                                    $ {supplierProfile.minOrderAmount.toLocaleString()}
                                </span>
                            </div>
                        ) : null}
                        <Separator className="my-2" />
                        <div className="flex justify-between font-black text-lg">
                            <span>Total</span>
                            <span className="text-primary">
                                {isToBeAgreed ? `$ ${subtotal.toLocaleString()} + Envío` : `$ ${total.toLocaleString()}`}
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button 
                        className="w-full h-12 text-lg font-black" 
                        disabled={loading}
                        onClick={handlePlaceOrder}
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                        Confirmar Pedido
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

import { Separator } from '@/components/ui/separator';
