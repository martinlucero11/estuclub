'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/cart-context';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetTrigger,
    SheetFooter,
    SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckoutDialog } from './checkout-dialog';

interface CartSheetProps {
    children: React.ReactNode;
}

export function CartSheet({ children }: CartSheetProps) {
    const { items, removeItem, updateQuantity, clearCart, subtotal, totalItems } = useCart();
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    return (
        <>
            <Sheet>
                <SheetTrigger asChild>
                    {children}
                </SheetTrigger>
                <SheetContent className="flex flex-col w-full sm:max-w-md">
                    <SheetHeader className="pb-4 border-b">
                        <SheetTitle className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-primary" /> Tu Carrito ({totalItems})
                        </SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 overflow-hidden flex flex-col">
                        {items.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
                                <ShoppingCart className="h-16 w-16 mb-4" />
                                <p className="font-bold">Tu carrito está vacío</p>
                                <p className="text-sm">Agrega productos de tus comercios favoritos.</p>
                            </div>
                        ) : (
                            <>
                                <ScrollArea className="flex-1 py-4 pr-4">
                                    <div className="space-y-4">
                                        {items.map((item) => (
                                            <div key={item.productId} className="flex justify-between gap-4">
                                                <div className="space-y-1 flex-1">
                                                    <h4 className="font-bold text-sm leading-tight">{item.name}</h4>
                                                    <p className="text-xs text-primary font-black">$ {item.price.toLocaleString()}</p>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center bg-muted rounded-full px-2 py-1">
                                                        <button 
                                                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                            className="h-6 w-6 flex items-center justify-center hover:text-primary transition-colors"
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                                                        <button 
                                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                            className="h-6 w-6 flex items-center justify-center hover:text-primary transition-colors"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-destructive opacity-50 hover:opacity-100"
                                                        onClick={() => removeItem(item.productId)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                <div className="pt-4 border-t space-y-4">
                                    <div className="flex items-center justify-between font-black text-xl">
                                        <span>Subtotal</span>
                                        <span className="text-primary">$ {subtotal.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center mt-2">
                                        Los costos de envío se calcularán en el siguiente paso
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    <SheetFooter className="pt-6 border-t mt-auto">
                        {items.length > 0 && (
                            <div className="w-full space-y-2">
                                <Button 
                                    className="w-full h-12 font-black text-lg gap-2 shadow-xl shadow-primary/20"
                                    onClick={() => setCheckoutOpen(true)}
                                >
                                    Continuar con el Pedido
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    className="w-full text-xs text-muted-foreground"
                                    onClick={clearCart}
                                >
                                    Vaciar Carrito
                                </Button>
                            </div>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
        </>
    );
}
