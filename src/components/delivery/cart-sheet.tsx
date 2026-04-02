'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/cart-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, Trash2, ShoppingBag, CreditCard, Sparkles, X, ChevronRight } from 'lucide-react';
import { optimizeImage } from '@/lib/utils';
import Image from 'next/image';
import { haptic } from '@/lib/haptics';
import { Separator } from '@/components/ui/separator';
import { CheckoutDialog } from './checkout-dialog';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CartSheetProps {
    children?: React.ReactNode;
}

export function CartSheet({ children }: CartSheetProps) {
    const { items, supplierName, totalItems, subtotal, updateQuantity, removeItem, clearCart } = useCart();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleConfirmOrder = () => {
        if (!items.length) return;
        haptic.vibrateSuccess();
        setIsCheckoutOpen(true);
    };

    return (
        <>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    {children ? children : <div className="hidden" />}
                </SheetTrigger>
                
                {/* 
                   Web: Right Side Drawer
                   Mobile: Bottom Sheet
                */}
                <SheetContent 
                    side="right" 
                    className="w-full sm:max-w-md bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl border-l border-slate-100 dark:border-white/5 p-0 overflow-hidden flex flex-col shadow-2xl transition-all duration-500 ease-out"
                >
                    <SheetHeader className="p-8 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <SheetTitle className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase leading-none">Mi Carrito</SheetTitle>
                                {supplierName && (
                                    <p className="text-primary font-black uppercase tracking-[0.2em] text-[8px] flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                        {supplierName}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {items.length > 0 && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="rounded-xl h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-500/10"
                                        onClick={() => { if (confirm('¿Vaciar?')) clearCart(); }}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                )}
                                <SheetClose asChild>
                                    <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 bg-slate-100 dark:bg-white/5 text-slate-500">
                                        <X className="h-5 w-5" />
                                    </Button>
                                </SheetClose>
                            </div>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 px-8">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                                <div className="h-20 w-20 rounded-3xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/5 opacity-50">
                                    <ShoppingBag className="h-8 w-8 text-slate-300" />
                                </div>
                                <p className="font-black italic text-xl tracking-tighter text-slate-300 dark:text-white/20 uppercase">No hay nada aquí...</p>
                            </div>
                        ) : (
                            <div className="py-4 space-y-6">
                                {items.map((item) => (
                                    <div key={item.productId} className="flex gap-5 group">
                                        <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-100 dark:border-white/5 group-hover:border-primary/20 transition-all duration-300">
                                            {item.imageUrl ? (
                                                <Image src={optimizeImage(item.imageUrl, 200)} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-8 w-8 text-slate-300" /></div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 space-y-2">
                                            <div className="space-y-0.5">
                                                <h4 className="font-black text-base tracking-tighter text-slate-900 dark:text-white leading-tight uppercase italic">{item.name}</h4>
                                                <p className="text-primary font-black text-sm tracking-tight">$ {item.price.toLocaleString()}</p>
                                            </div>
                                            
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 rounded-xl px-2 py-1">
                                                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-white/10 active:scale-90 transition-all"><Minus className="h-3 w-3" /></button>
                                                    <span className="w-4 text-center text-xs font-black italic">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-white/10 active:scale-90 transition-all"><Plus className="h-3 w-3" /></button>
                                                </div>
                                                
                                                <button onClick={() => removeItem(item.productId)} className="text-slate-300 p-2 hover:text-red-500 transition-colors">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <SheetFooter className="p-8 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 sm:flex-col gap-6">
                        <div className="flex items-center justify-between w-full">
                            <div className="space-y-0.5">
                                <span className="text-slate-400 font-black uppercase tracking-[0.2em] text-[8px]">Inversión Total</span>
                                <p className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-none">$ {subtotal.toLocaleString()}</p>
                            </div>
                            <Badge variant="outline" className="border-slate-200 dark:border-white/10 text-slate-500 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg">
                                {totalItems} items
                            </Badge>
                        </div>
                        
                        <Button 
                            onClick={handleConfirmOrder} 
                            disabled={items.length === 0}
                            className="w-full h-16 rounded-2xl bg-primary hover:bg-primary text-white font-black text-lg tracking-widest italic shadow-xl shadow-primary/20 transition-all active:scale-[0.98] border-none flex items-center gap-3 group"
                        >
                            <Sparkles className="h-5 w-5 animate-pulse" />
                            CONTINUAR AL PAGO
                            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <p className="text-[8px] text-center text-slate-400 font-black uppercase tracking-[0.3em]">
                            Verificado por Mercado Pago
                        </p>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* 
               MOBILE FLOATING ACTION BAR 
               Only visible when items > 0 and not on desktop 
            */}
            <AnimatePresence>
                {items.length > 0 && !isOpen && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-24 left-4 right-4 z-[90] sm:hidden"
                    >
                        <button 
                            onClick={() => { haptic.vibrateSubtle(); setIsOpen(true); }}
                            className="w-full bg-slate-900 dark:bg-white/95 text-white dark:text-slate-900 h-16 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between px-6 border border-white/5 backdrop-blur-xl group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white relative group-hover:scale-110 transition-transform">
                                    <ShoppingBag className="h-5 w-5" />
                                    <span className="absolute -top-2 -right-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-[8px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-primary">
                                        {totalItems}
                                    </span>
                                </div>
                                <div className="space-y-0.5 text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Ver Carrito</p>
                                    <p className="text-lg font-black tracking-tighter leading-none italic">$ {subtotal.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest group-hover:translate-x-[-15px] group-hover:opacity-100 opacity-40 transition-all">Revisar</span>
                                <ChevronRight className="h-5 w-5 text-primary" />
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <CheckoutDialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen} />
        </>
    );
}
