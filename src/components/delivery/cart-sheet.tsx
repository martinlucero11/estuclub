'use client';

import React from 'react';
import { useCart } from '@/context/cart-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle, CreditCard, Sparkles } from 'lucide-react';
import { optimizeImage } from '@/lib/utils';
import Image from 'next/image';
import { haptic } from '@/lib/haptics';
import { Separator } from '@/components/ui/separator';
import { CheckoutDialog } from './checkout-dialog';

interface CartSheetProps {
    children: React.ReactNode;
}

export function CartSheet({ children }: CartSheetProps) {
    const { items, supplierName, supplierPhone, totalItems, subtotal, updateQuantity, removeItem, clearCart } = useCart();
    const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);

    const handleConfirmOrder = () => {
        if (!items.length) return;
        haptic.vibrateSuccess();
        setIsCheckoutOpen(true);
    };

    return (
        <>
            <Sheet>
                <SheetTrigger asChild>
                    {children}
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[90vh] sm:h-[600px] rounded-t-[3rem] glass glass-dark border-t border-white/10 p-0 overflow-hidden flex flex-col">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-white/10" />
                    
                    <SheetHeader className="p-6 pb-2">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <SheetTitle className="text-3xl font-black tracking-tighter italic">Tu Carrito</SheetTitle>
                                {supplierName && (
                                    <p className="text-pink-500 font-black uppercase tracking-widest text-[10px]">Pidiendo a: {supplierName}</p>
                                )}
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-full text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                    if (confirm('¿Vaciar el carrito?')) clearCart();
                                }}
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </SheetHeader>

                    <Separator className="bg-white/5" />

                    <ScrollArea className="flex-1 px-6">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center">
                                    <ShoppingBag className="h-10 w-10 text-muted-foreground opacity-20" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-lg">Tu carrito está vacío</p>
                                    <p className="text-sm text-muted-foreground">¡Añade algo rico para empezar!</p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-6 space-y-6">
                                {items.map((item) => (
                                    <div key={item.productId} className="flex gap-4 group">
                                        <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-muted flex-shrink-0 border border-white/5">
                                            {item.imageUrl ? (
                                                <Image 
                                                    src={optimizeImage(item.imageUrl, 200)} 
                                                    alt={item.name} 
                                                    fill 
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                                    <ShoppingBag className="h-8 w-8" />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div className="space-y-0.5">
                                                <h4 className="font-black text-sm tracking-tight leading-tight">{item.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    {item.originalPrice && item.originalPrice > item.price && (
                                                        <span className="text-[10px] text-muted-foreground line-through opacity-50 font-bold">
                                                            $ {(item.originalPrice * item.quantity).toLocaleString()}
                                                        </span>
                                                    )}
                                                    <p className="text-pink-500 font-bold text-xs">$ {(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-1">
                                                    <button 
                                                        onClick={() => {
                                                            haptic.vibrateSubtle();
                                                            updateQuantity(item.productId, item.quantity - 1);
                                                        }}
                                                        className="h-7 w-7 flex items-center justify-center rounded-lg bg-secondary/10 hover:bg-secondary/20 hover:text-pink-500 transition-all active:scale-95 border border-pink-500/10"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <div className="w-8 h-7 flex items-center justify-center text-sm font-black text-center bg-transparent">
                                                        {item.quantity}
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            haptic.vibrateSubtle();
                                                            updateQuantity(item.productId, item.quantity + 1);
                                                        }}
                                                        className="h-7 w-7 flex items-center justify-center rounded-lg bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 transition-all active:scale-95 border border-pink-500/20"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => {
                                                        haptic.vibrateSubtle();
                                                        removeItem(item.productId);
                                                    }}
                                                    className="text-muted-foreground h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <SheetFooter className="p-6 bg-gradient-to-t from-background to-transparent border-t border-white/10 flex-col gap-4 sm:flex-col">
                        <div className="flex items-center justify-between w-full mb-2">
                            <span className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Subtotal</span>
                            <span className="text-2xl font-black text-pink-500">$ {subtotal.toLocaleString()}</span>
                        </div>
                        
                        <Button 
                            onClick={handleConfirmOrder} 
                            disabled={items.length === 0}
                            className="w-full h-16 rounded-[1.5rem] bg-pink-500 hover:bg-pink-400 text-black font-black text-lg tracking-[0.2em] uppercase shadow-2xl shadow-pink-500/20 gap-3 border-none relative group overflow-hidden"
                        >
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-6 w-6" />
                                PAGAR AHORA
                                <Sparkles className="h-5 w-5 animate-pulse" />
                            </div>
                            <div className="absolute inset-0 bg-white/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </Button>
                        <p className="text-[10px] text-center text-slate-500 uppercase tracking-widest font-black opacity-60 px-4">
                            Pagos 100% Seguros vía Mercado Pago • EstuClub Riders
                        </p>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <CheckoutDialog 
                open={isCheckoutOpen} 
                onOpenChange={setIsCheckoutOpen} 
            />
        </>
    );
}
