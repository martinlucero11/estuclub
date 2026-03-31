'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { OrderItem } from '@/types/data';

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
    const [items, setItems] = useState<OrderItem[]>([]);
    const [supplierId, setSupplierId] = useState<string | null>(null);
    const [supplierName, setSupplierName] = useState<string | null>(null);
    const [supplierPhone, setSupplierPhone] = useState<string | null>(null);

    useEffect(() => {
        const savedCart = localStorage.getItem('estuclub_cart');
        const savedSupplierId = localStorage.getItem('estuclub_cart_sid');
        const savedSupplierName = localStorage.getItem('estuclub_cart_sname');
        const savedSupplierPhone = localStorage.getItem('estuclub_cart_sphone');
        
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
                setSupplierId(savedSupplierId);
                setSupplierName(savedSupplierName);
                setSupplierPhone(savedSupplierPhone);
            } catch (e) {
                console.error('Error parsing cart from localStorage', e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('estuclub_cart', JSON.stringify(items));
        if (supplierId) localStorage.setItem('estuclub_cart_sid', supplierId);
        else localStorage.removeItem('estuclub_cart_sid');
        
        if (supplierName) localStorage.setItem('estuclub_cart_sname', supplierName);
        else localStorage.removeItem('estuclub_cart_sname');

        if (supplierPhone) localStorage.setItem('estuclub_cart_sphone', supplierPhone);
        else localStorage.removeItem('estuclub_cart_sphone');
    }, [items, supplierId, supplierName, supplierPhone]);

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
                    ? { ...i, quantity: i.quantity + newItem.quantity, price: newItem.price }
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
