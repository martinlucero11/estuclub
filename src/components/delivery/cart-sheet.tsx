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
import { Badge } from '@/components/ui/badge';

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
                <SheetContent side="bottom" className="h-[90vh] sm:h-[650px] rounded-t-[3.5rem] bg-white border-t border-slate-100 p-0 overflow-hidden flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.08)] selection:bg-pink-100">
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-slate-200" />
                    
                    <SheetHeader className="p-10 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <SheetTitle className="text-4xl font-black italic tracking-tighter text-slate-900">Tu Carrito</SheetTitle>
                                {supplierName && (
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-estuclub-rosa animate-pulse" />
                                        <p className="text-estuclub-rosa font-black uppercase tracking-[0.2em] text-[10px]">Pidiendo a: {supplierName}</p>
                                    </div>
                                )}
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50/50 transition-all"
                                onClick={() => {
                                    if (confirm('¿Vaciar el carrito?')) clearCart();
                                }}
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 px-10">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                                <div className="h-24 w-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center border border-slate-100 rotate-12">
                                    <ShoppingBag className="h-10 w-10 text-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <p className="font-black italic text-2xl tracking-tighter text-slate-300">Carrito vacío</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Elegí algo épico</p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-6 space-y-8">
                                {items.map((item) => (
                                    <div key={item.productId} className="flex gap-6 group">
                                        <div className="relative h-24 w-24 rounded-[2rem] overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100 group-hover:border-pink-200 transition-all duration-500 shadow-sm">
                                            {item.imageUrl ? (
                                                <Image 
                                                    src={optimizeImage(item.imageUrl, 200)} 
                                                    alt={item.name} 
                                                    fill 
                                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                    <ShoppingBag className="h-10 w-10" />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col justify-center gap-2">
                                            <div className="space-y-1">
                                                <h4 className="font-black text-xl tracking-tighter italic text-slate-900 leading-tight">{item.name}</h4>
                                                <div className="flex items-center gap-3">
                                                    {item.originalPrice && item.originalPrice > item.price && (
                                                        <span className="text-xs text-slate-300 line-through font-bold">
                                                            $ {(item.originalPrice * item.quantity).toLocaleString()}
                                                        </span>
                                                    )}
                                                    <p className="text-estuclub-rosa font-black text-base tracking-tight">$ {(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-1.5">
                                                    <button 
                                                        onClick={() => {
                                                            haptic.vibrateSubtle();
                                                            updateQuantity(item.productId, item.quantity - 1);
                                                        }}
                                                        className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-white hover:text-estuclub-rosa shadow-sm transition-all active:scale-90 border border-transparent hover:border-slate-200"
                                                    >
                                                        <Minus className="h-3.5 w-3.5" />
                                                    </button>
                                                    <div className="w-6 h-9 flex items-center justify-center text-sm font-black text-slate-900 italic tracking-tighter">
                                                        {item.quantity}
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            haptic.vibrateSubtle();
                                                            updateQuantity(item.productId, item.quantity + 1);
                                                        }}
                                                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-estuclub-rosa text-white shadow-lg shadow-estuclub-rosa/20 transition-all active:scale-95"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => {
                                                        haptic.vibrateSubtle();
                                                        removeItem(item.productId);
                                                    }}
                                                    className="text-slate-300 invisible group-hover:visible transition-all p-2.5 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                                >
                                                    <Trash2 className="h-4.5 w-4.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <SheetFooter className="p-10 bg-slate-50 border-t border-slate-100 flex-col gap-6 sm:flex-col">
                        <div className="flex items-center justify-between w-full">
                            <div className="space-y-1">
                                <span className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Inversión Bruta</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-4xl font-black italic tracking-tighter text-slate-900">$ {subtotal.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge className="bg-white border-slate-100 text-slate-900 font-black text-[10px] py-1.5 px-4 shadow-sm">
                                    {totalItems} ITEMS EN BOLSA
                                </Badge>
                            </div>
                        </div>
                        
                        <Button 
                            onClick={handleConfirmOrder} 
                            disabled={items.length === 0}
                            className="w-full h-24 rounded-[3rem] bg-estuclub-rosa hover:bg-estuclub-rosa text-white font-black text-2xl tracking-[0.1em] italic shadow-[0_25px_50px_-12px_rgba(217,59,100,0.4)] transition-all hover:scale-[1.01] active:scale-95 border-none group relative overflow-hidden"
                        >
                            <div className="relative z-10 flex items-center gap-4">
                                PAGAR AHORA
                                <Sparkles className="h-7 w-7 animate-pulse" />
                            </div>
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                        </Button>
                        <p className="text-[10px] text-center text-slate-400 font-black uppercase tracking-[0.3em] px-4">
                            Pagos 100% Seguros Vía Mercado Pago
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
