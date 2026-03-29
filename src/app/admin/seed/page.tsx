'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, getDocs, deleteDoc, query, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2, RefreshCw } from 'lucide-react';

const DEMO_CATEGORIES = [
    // Delivery Categories
    { id: 'cat_rest', name: 'Restaurantes', emoji: '🍴', colorClass: 'bg-orange-500', type: 'delivery', order: 1 },
    { id: 'cat_burg', name: 'Hamburguesas', emoji: '🍔', colorClass: 'bg-yellow-500', type: 'delivery', order: 2 },
    { id: 'cat_sushi', name: 'Sushi', emoji: '🍣', colorClass: 'bg-red-500', type: 'delivery', order: 3 },
    { id: 'cat_pizza', name: 'Pizza', emoji: '🍕', colorClass: 'bg-orange-600', type: 'delivery', order: 4 },
    { id: 'cat_cafe', name: 'Café & Deli', emoji: '☕', colorClass: 'bg-brown-500', type: 'delivery', order: 5 },
    { id: 'cat_super', name: 'Súper', emoji: '🛒', colorClass: 'bg-green-500', type: 'delivery', order: 7 },
    { id: 'cat_farma', name: 'Farmacia', emoji: '💊', colorClass: 'bg-emerald-500', type: 'delivery', order: 8 },
    // Benefit Categories
    { id: 'cat_turismo', name: 'Turismo', emoji: '✈️', colorClass: 'bg-blue-600', type: 'perks', order: 1 },
    { id: 'cat_gastronomia', name: 'Comida', emoji: '🍷', colorClass: 'bg-pink-600', type: 'perks', order: 2 },
    { id: 'cat_educacion', name: 'Educación', emoji: '🎓', colorClass: 'bg-indigo-600', type: 'perks', order: 3 },
    { id: 'cat_entretenimiento', name: 'Cine & Ocio', emoji: '🎬', colorClass: 'bg-purple-600', type: 'perks', order: 4 },
];

const DEMO_SUPPLIERS = [
    { 
        id: 'sup1', name: 'Napolitan Premium Pizza', type: 'Comida Rápida', 
        logoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1574129810282-eef007fca39d?q=80&w=1000&auto=format&fit=crop',
        isFeatured: true, deliveryEnabled: true, deliveryCost: 1500, deliveryCategory: 'Comida Rápida', slug: 'pizzeria-napolitana', isVisible: true 
    },
    { 
        id: 'sup2', name: 'Sushi ZenMaster', type: 'Restaurantes', 
        logoUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=200&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1000&auto=format&fit=crop',
        isFeatured: true, deliveryEnabled: true, deliveryCost: 2000, deliveryCategory: 'Restaurantes', slug: 'sushi-zen', isVisible: true 
    },
    { 
        id: 'sup3', name: 'Burger Master Royal', type: 'Comida Rápida', 
        logoUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=200&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1000&auto=format&fit=crop',
        isFeatured: true, deliveryEnabled: true, deliveryCost: 1200, deliveryCategory: 'Comida Rápida', slug: 'burger-master', isVisible: true 
    },
    { 
        id: 'sup4', name: 'Farmacia General 24hs', type: 'Salud', 
        logoUrl: 'https://images.unsplash.com/photo-1587854680352-936b22b91030?q=80&w=200&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?q=80&w=1000&auto=format&fit=crop',
        isFeatured: false, deliveryEnabled: true, deliveryCost: 1000, deliveryCategory: 'Farmacia', slug: 'farmacia-24hs', isVisible: true 
    },
    { 
        id: 'sup5', name: 'Green Salad Boutique', type: 'Restaurantes', 
        logoUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&auto=format&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop',
        isFeatured: true, deliveryEnabled: true, deliveryCost: 1800, deliveryCategory: 'Restaurantes', slug: 'green-salad-bar', isVisible: true 
    },
];

const DEMO_PRODUCTS = [
    { supplierId: 'sup1', name: 'Pizza Margherita XL', price: 9500, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop', stockAvailable: true, isActive: true, category: 'Pizza' },
    { supplierId: 'sup3', name: 'Burger Triple Bacon', price: 11000, imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=800&auto=format&fit=crop', stockAvailable: true, isActive: true, category: 'Hamburguesas' },
    { supplierId: 'sup2', name: 'Barco Sushi 30p', price: 25000, imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=800&auto=format&fit=crop', stockAvailable: true, isActive: true, category: 'Sushi' },
];

const DEMO_BENEFITS = [
    { id: 'ben_1', title: '2x1 en Cabañas del Bosque', highlight: 'Escapada Soñada', category: 'Turismo', imageUrl: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1000&auto=format&fit=crop', ownerId: 'sup1', points: 500, isFeatured: true, isVisible: true, status: 'active' },
    { id: 'ben_2', title: 'Cena Gourmet 2 Pasos', highlight: 'Gastronomía Deluxe', category: 'Comida', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop', ownerId: 'sup2', points: 300, isFeatured: true, isVisible: true, status: 'active' },
    { id: 'ben_3', title: 'Pase Libre Mensual Gym', highlight: 'Entrená con Todo', category: 'Entretenimiento', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop', ownerId: 'sup3', points: 800, isFeatured: false, isVisible: true, status: 'active' },
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

            // 1. Clear Collections (Categories, Products, Suppliers, Benefits)
            const collections = ['categories', 'products', 'roles_supplier', 'home_sections', 'perks'];
            for (const collName of collections) {
                const snapshot = await getDocs(collection(firestore, collName));
                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    // Skip precious accounts
                    if (collName === 'roles_supplier' && data.email === 'melanieosores@gmail.com') return;
                    batch.delete(docSnap.ref);
                });
            }

            // 6. Create Homepage Sections for Delivery
            const sections = [
                // --- DELIVERY BOARD ---
                {
                    title: "Localidades destacadas",
                    order: 10, isActive: true, targetBoard: 'delivery',
                    block: { kind: 'minisuppliers', contentType: 'minisuppliers', mode: 'auto', query: { filters: [{ field: 'isVisible', op: '==', value: true }, { field: 'deliveryEnabled', op: '==', value: true }], limit: 10 } }
                },
                {
                    title: "Nuestras Recomendaciones",
                    order: 20, isActive: true, targetBoard: 'delivery',
                    block: { kind: 'carousel', contentType: 'supplierpromo', mode: 'auto', query: { filters: [{ field: 'isVisible', op: '==', value: true }, { field: 'isFeatured', op: '==', value: true }], limit: 5 } }
                },
                {
                    title: "Restaurantes Destacados",
                    order: 30, isActive: true, targetBoard: 'delivery',
                    block: { kind: 'carousel', contentType: 'delivery_suppliers', mode: 'auto', query: { filters: [{ field: 'isVisible', op: '==', value: true }, { field: 'deliveryEnabled', op: '==', value: true }], limit: 5 } }
                },
                // --- BENEFITS BOARD ---
                {
                    title: "Beneficios Destacados",
                    order: 10, isActive: true, targetBoard: 'perks',
                    block: { kind: 'carousel', contentType: 'perks', mode: 'auto', query: { filters: [{ field: 'isVisible', op: '==', value: true }, { field: 'isFeatured', op: '==', value: true }], limit: 5 } }
                },
                {
                    title: "Explorá Categorías",
                    order: 20, isActive: true, targetBoard: 'perks',
                    block: { kind: 'categories' }
                }
            ];

            sections.forEach(s => {
                const sRef = doc(collection(firestore, 'home_sections'));
                batch.set(sRef, { ...s, createdAt: serverTimestamp() });
            });

            // 2. Add Categories
            DEMO_CATEGORIES.forEach(c => {
                const cRef = doc(firestore, 'categories', c.id);
                batch.set(cRef, { ...c, createdAt: serverTimestamp() });
            });

            // 7. Add Benefits
            DEMO_BENEFITS.forEach(b => {
                const bRef = doc(firestore, 'perks', b.id);
                batch.set(bRef, { ...b, createdAt: serverTimestamp(), imageUrl: b.imageUrl });
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
