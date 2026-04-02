'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { OrderItem } from '@/types/data';
import { useUser } from '@/firebase';

interface CartContextType {
    items: OrderItem[];
    supplierId: string | null;
    supplierName: string | null;
    supplierPhone: string | null;
    addItem: (item: OrderItem, supplier: { id: string, name: string, phone: string }) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const hasLoadedForUser = useRef<string | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [supplierId, setSupplierId] = useState<string | null>(null);
    const [supplierName, setSupplierName] = useState<string | null>(null);
    const [supplierPhone, setSupplierPhone] = useState<string | null>(null);

    // Dynamic keys based on user UID
    const cartKey = user ? `estuclub_cart_${user.uid}` : 'estuclub_cart_anon';
    const sidKey = user ? `estuclub_cart_sid_${user.uid}` : 'estuclub_cart_sid_anon';
    const snameKey = user ? `estuclub_cart_sname_${user.uid}` : 'estuclub_cart_sname_anon';
    const sphoneKey = user ? `estuclub_cart_sphone_${user.uid}` : 'estuclub_cart_sphone_anon';

    // Clear state on UID change to avoid data leakage
    useEffect(() => {
        hasLoadedForUser.current = null;
    }, [user?.uid]);

    useEffect(() => {
        if (isUserLoading) return;

        const savedCart = localStorage.getItem(cartKey);
        const savedSupplierId = localStorage.getItem(sidKey);
        const savedSupplierName = localStorage.getItem(snameKey);
        const savedSupplierPhone = localStorage.getItem(sphoneKey);
        
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
                setSupplierId(savedSupplierId);
                setSupplierName(savedSupplierName);
                setSupplierPhone(savedSupplierPhone);
            } catch (e) {
                console.error('Error parsing cart from localStorage', e);
                setItems([]);
                setSupplierId(null);
                setSupplierName(null);
                setSupplierPhone(null);
            }
        } else {
            setItems([]);
            setSupplierId(null);
            setSupplierName(null);
            setSupplierPhone(null);
        }
        hasLoadedForUser.current = user?.uid || 'anon';
    }, [user?.uid, isUserLoading, cartKey, sidKey, snameKey, sphoneKey]);

    useEffect(() => {
        if (isUserLoading || hasLoadedForUser.current !== (user?.uid || 'anon')) return;

        localStorage.setItem(cartKey, JSON.stringify(items));
        if (supplierId) localStorage.setItem(sidKey, supplierId);
        else localStorage.removeItem(sidKey);
        
        if (supplierName) localStorage.setItem(snameKey, supplierName);
        else localStorage.removeItem(snameKey);

        if (supplierPhone) localStorage.setItem(sphoneKey, supplierPhone);
        else localStorage.removeItem(sphoneKey);
    }, [items, supplierId, supplierName, supplierPhone, cartKey, sidKey, snameKey, sphoneKey, isUserLoading]);

    const addItem = (newItem: OrderItem, supplier: { id: string, name: string, phone: string }) => {
        if (supplierId && supplierId !== supplier.id) {
            if (!confirm('Tu carrito tiene productos de otro comercio. ¿Deseas vaciarlo e iniciar un nuevo pedido?')) {
                return;
            }
            setItems([]);
        }

        setSupplierId(supplier.id);
        setSupplierName(supplier.name);
        setSupplierPhone(supplier.phone);

        setItems(prev => {
            const existing = prev.find(i => i.productId === newItem.productId);
            if (existing) {
                return prev.map(i => i.productId === newItem.productId 
                    ? { ...i, quantity: i.quantity + newItem.quantity, price: newItem.price, originalPrice: newItem.originalPrice }
                    : i
                );
            }
            return [...prev, newItem];
        });
    };

    const removeItem = (productId: string) => {
        setItems(prev => {
            const newItems = prev.filter(i => i.productId !== productId);
            if (newItems.length === 0) {
                setSupplierId(null);
                setSupplierName(null);
            }
            return newItems;
        });
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }
        setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity } : i));
    };

    const clearCart = () => {
        setItems([]);
        setSupplierId(null);
        setSupplierName(null);
        setSupplierPhone(null);
    };

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            items,
            supplierId,
            supplierName,
            supplierPhone,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            totalItems,
            subtotal,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
