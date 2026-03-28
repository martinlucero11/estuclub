'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, getDocs, deleteDoc, query, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2, RefreshCw } from 'lucide-react';

const DEMO_CATEGORIES = [
    { id: 'cat_rest', name: 'Restaurantes', emoji: '🍴', colorClass: 'bg-orange-500', type: 'delivery', order: 1 },
    { id: 'cat_burg', name: 'Hamburguesas', emoji: '🍔', colorClass: 'bg-yellow-500', type: 'delivery', order: 2 },
    { id: 'cat_sushi', name: 'Sushi', emoji: '🍣', colorClass: 'bg-red-500', type: 'delivery', order: 3 },
    { id: 'cat_pizza', name: 'Pizza', emoji: '🍕', colorClass: 'bg-orange-600', type: 'delivery', order: 4 },
    { id: 'cat_cafe', name: 'Café & Deli', emoji: '☕', colorClass: 'bg-brown-500', type: 'delivery', order: 5 },
    { id: 'cat_ice', name: 'Helados', emoji: '🍦', colorClass: 'bg-blue-300', type: 'delivery', order: 6 },
    { id: 'cat_super', name: 'Súper', emoji: '🛒', colorClass: 'bg-green-500', type: 'delivery', order: 7 },
    { id: 'cat_farma', name: 'Farmacia', emoji: '💊', colorClass: 'bg-emerald-500', type: 'delivery', order: 8 },
];

const DEMO_SUPPLIERS = [
    { id: 'supp_1', name: 'Big Burger Burger', type: 'Comida Rápida', slug: 'big-burger', logoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop', deliveryEnabled: true, deliveryCost: 1500, deliveryCategory: 'Comida Rápida', avgRating: 4.8 },
    { id: 'supp_2', name: 'Sushi ZenMaster', type: 'Restaurantes', slug: 'sushi-zen', logoUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=400&auto=format&fit=crop', deliveryEnabled: true, deliveryCost: 2000, deliveryCategory: 'Restaurantes', avgRating: 4.9 },
    { id: 'supp_3', name: 'Pizza La Nostra', type: 'Restaurantes', slug: 'la-nostra', logoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400&auto=format&fit=crop', deliveryEnabled: true, deliveryCost: 1200, deliveryCategory: 'Restaurantes', avgRating: 4.7 },
    { id: 'supp_4', name: 'Cafe Arábica', type: 'Servicios', slug: 'cafe-arabica', logoUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop', deliveryEnabled: true, deliveryCost: 800, deliveryCategory: 'Bebidas', avgRating: 4.5 },
    { id: 'supp_5', name: 'Helados Glaciares', type: 'Comercio', slug: 'glaciares', logoUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?q=80&w=400&auto=format&fit=crop', deliveryEnabled: true, deliveryCost: 1000, deliveryCategory: 'Otros', avgRating: 4.6 },
    { id: 'supp_6', name: 'Farmacia 24/7', type: 'Salud', slug: 'farma-24', logoUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?q=80&w=400&auto=format&fit=crop', deliveryEnabled: true, deliveryCost: 500, deliveryCategory: 'Farmacia', avgRating: 4.2 },
    { id: 'supp_7', name: 'Súper EstuClub', type: 'Comercio', slug: 'super-estu', logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop', deliveryEnabled: true, deliveryCost: 3000, deliveryCategory: 'Supermercado', avgRating: 4.4 },
    { id: 'supp_8', name: 'Donas Mágicas', type: 'Emprendimiento', slug: 'donas-magicas', logoUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=400&auto=format&fit=crop', deliveryEnabled: true, deliveryCost: 900, deliveryCategory: 'Otros', avgRating: 4.9 },
    { id: 'supp_9', name: 'Tacos Veracruz', type: 'Restaurantes', slug: 'tacos-veracruz', logoUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400&auto=format&fit=crop', deliveryEnabled: true, deliveryCost: 1300, deliveryCategory: 'Restaurantes', avgRating: 4.7 },
];

const DEMO_PRODUCTS = [
    { supplierId: 'supp_1', name: 'Hamburguesa Doble Queso', price: 9500, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop', stockAvailable: true, isActive: true, category: 'Comida Rápida' },
    { supplierId: 'supp_1', name: 'Papas Fritas XL', price: 3500, imageUrl: 'https://images.unsplash.com/photo-1518013045384-e16e2b92f708?q=80&w=800&auto=format&fit=crop', stockAvailable: true, isActive: true, category: 'Comida Rápida' },
    { supplierId: 'supp_2', name: 'Combo Sushi Mix 15p', price: 18500, imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800&auto=format&fit=crop', stockAvailable: true, isActive: true, category: 'Restaurantes' },
    { supplierId: 'supp_3', name: 'Pizza Muzza Familiar', price: 11000, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop', stockAvailable: true, isActive: true, category: 'Restaurantes' },
    { supplierId: 'supp_4', name: 'Café Latte XL', price: 4200, imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop', stockAvailable: true, isActive: true, category: 'Bebidas' },
    { supplierId: 'supp_7', name: 'Pack Leche x 6', price: 7200, imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop', stockAvailable: true, isActive: true, category: 'Supermercado' },
];

export default function SeedPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const clearAndSeed = async () => {
        if (!firestore) return;
        setLoading(true);
        try {
            const batch = writeBatch(firestore);

            // 1. Clear Collections (Categories, Products, Suppliers)
            const collections = ['categories', 'products', 'roles_supplier'];
            for (const collName of collections) {
                const snapshot = await getDocs(collection(firestore, collName));
                snapshot.forEach(docSnap => {
                    batch.delete(docSnap.ref);
                });
            }

            // 2. Add Categories
            DEMO_CATEGORIES.forEach(c => {
                const cRef = doc(firestore, 'categories', c.id);
                batch.set(cRef, {
                    ...c,
                    createdAt: serverTimestamp()
                });
            });

            // 3. Add Suppliers
            DEMO_SUPPLIERS.forEach(s => {
                const sRef = doc(firestore, 'roles_supplier', s.id);
                batch.set(sRef, {
                    ...s,
                    isVisible: true,
                    isFeatured: true,
                    whatsappContact: '123456789',
                    createdAt: serverTimestamp()
                });
            });

            // 4. Add Products
            DEMO_PRODUCTS.forEach((p) => {
                const pRef = doc(collection(firestore, 'products'));
                batch.set(pRef, {
                    ...p,
                    createdAt: serverTimestamp()
                });
            });

            await batch.commit();
            toast({ title: 'Base de datos reseteada y sembrada!' });
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error al procesar', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-20 flex flex-col items-center gap-8 bg-background min-h-screen">
            <div className="p-10 rounded-[3rem] glass glass-dark border border-white/10 shadow-premium text-center max-w-xl">
                <RefreshCw className={`h-16 w-16 mx-auto mb-6 text-primary ${loading ? 'animate-spin' : ''}`} />
                <h1 className="text-4xl font-black tracking-tighter mb-4 italic">Reset & Seed</h1>
                <p className="text-muted-foreground font-medium mb-8">
                    Esta acción <strong className="text-primary uppercase">eliminará todo</strong> de las colecciones de categorías, productos y proveedores para luego cargar los datos demo con imágenes funcionales.
                </p>
                <div className="flex flex-col gap-4">
                    <Button 
                        onClick={clearAndSeed} 
                        disabled={loading} 
                        size="lg"
                        className="h-16 rounded-2xl text-lg font-black tracking-widest uppercase shadow-xl hover:scale-105 transition-all"
                    >
                        {loading ? 'Procesando...' : 'Limpiar y Sembrar Todo'}
                    </Button>
                    <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Usa con precaución • Entorno de Desarrollo</p>
                </div>
            </div>
        </div>
    );
}
