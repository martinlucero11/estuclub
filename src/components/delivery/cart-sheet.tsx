'use client';

import React from 'react';
import { useCart } from '@/context/cart-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle } from 'lucide-react';
import { optimizeImage } from '@/lib/utils';
import Image from 'next/image';
import { haptic } from '@/lib/haptics';
import { Separator } from '@/components/ui/separator';

interface CartSheetProps {
    children: React.ReactNode;
}

export function CartSheet({ children }: CartSheetProps) {
    const { items, supplierName, supplierPhone, totalItems, subtotal, updateQuantity, removeItem, clearCart } = useCart();

    const handleConfirmOrder = () => {
        if (!items.length || !supplierPhone) return;
        haptic.vibrateSuccess();

        const itemLines = items.map(item => `- ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toLocaleString()})`).join('\n');
        const message = `*Nuevo Pedido via EstuClub*\n\nHola *${supplierName}*, quisiera realizar el siguiente pedido:\n\n${itemLines}\n\n*Total: $${subtotal.toLocaleString()}*\n\n_Pedido generado desde la app EstuClub_`;
        
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${supplierPhone}?text=${encodedMessage}`, '_blank');
    };

    return (
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
                                <p className="text-primary font-black uppercase tracking-widest text-[10px]">Pidiendo a: {supplierName}</p>
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
                                            <p className="text-primary font-bold text-xs">$ {(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-1 px-2 border border-white/5">
                                                <button 
                                                    onClick={() => {
                                                        haptic.vibrateSubtle();
                                                        updateQuantity(item.productId, item.quantity - 1);
                                                    }}
                                                    className="p-1 hover:text-primary transition-colors"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="text-xs font-black min-w-[1rem] text-center">{item.quantity}</span>
                                                <button 
                                                    onClick={() => {
                                                        haptic.vibrateSubtle();
                                                        updateQuantity(item.productId, item.quantity + 1);
                                                    }}
                                                    className="p-1 hover:text-primary transition-colors"
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
                        <span className="text-2xl font-black text-primary">$ {subtotal.toLocaleString()}</span>
                    </div>
                    
                    <Button 
                        onClick={handleConfirmOrder} 
                        disabled={items.length === 0}
                        className="w-full h-16 rounded-[1.5rem] bg-green-500 hover:bg-green-600 text-white font-black text-lg tracking-widest uppercase shadow-2xl shadow-green-500/20 gap-3 border-none"
                    >
                        <MessageCircle className="h-6 w-6" />
                        Confirmar via WhatsApp
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold opacity-30 px-4">
                        Serás redirigido a WhatsApp para finalizar tu pedido directamente con el local.
                    </p>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
