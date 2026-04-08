'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, setDoc, addDoc, serverTimestamp, getDocs, query, where, deleteDoc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Sparkles, Building2, Package, Gift, Calendar, Megaphone, CheckCircle2 } from 'lucide-react';
import BackButton from '@/components/layout/back-button';
import SplashScreen from '@/components/layout/splash-screen';
import { motion } from 'framer-motion';

// --- MOCK DATA DEFINITIONS ---

// --- MOCK DATA DEFINITIONS (LEANDRO N. ALEM, MISIONES) ---

const DEMO_SUPPLIERS = [
    {
        id: "demo-cluber-pizza",
        name: "Gastro Alem Pizza",
        storeName: "Gastro Alem Pizza",
        type: "Comercio",
        email: "pizza@demo.estuclub.com",
        slug: "gastro-alem",
        description: "Las mejores pizzas a la piedra de Leandro N. Alem con ingredientes regionales.",
        logoUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=200",
        address: "Av. Belgrano 630",
        location: {
            address: "Av. Belgrano 630",
            city: "Leandro N. Alem",
            lat: -27.5852,
            lng: -55.4781
        },
        deliveryEnabled: true,
        deliveryCost: 1400,
        isVisible: true,
        isFeatured: true,
        isDemo: true
    },
    {
        id: "demo-cluber-gym",
        name: "Titan Fitness Center",
        storeName: "Titan Fitness Center",
        type: "Profesional",
        email: "gym@demo.estuclub.com",
        slug: "titan-fitness",
        description: "Entrenamiento funcional y máquinas de última generación en el corazón de Alem.",
        logoUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200",
        address: "Av. Libertad 210",
        location: {
            address: "Av. Libertad 210",
            city: "Leandro N. Alem",
            lat: -27.5901,
            lng: -55.4805
        },
        appointmentsEnabled: true,
        isVisible: true,
        isFeatured: true,
        isDemo: true
    },
    {
        id: "demo-cluber-books",
        name: "Librería Estudiantil",
        storeName: "Librería Estudiantil",
        type: "Comercio",
        email: "books@demo.estuclub.com",
        slug: "libreria-estudiantil",
        description: "Todo lo que necesitas para tu cursada: fotocopias, útiles y bibliografía.",
        logoUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200",
        address: "Calle Urquiza 75",
        location: {
            address: "Calle Urquiza 75",
            city: "Leandro N. Alem",
            lat: -27.5815,
            lng: -55.4822
        },
        isVisible: true,
        isDemo: true
    },
    {
        id: "demo-cluber-coffee",
        name: "Coffee & Study Alem",
        storeName: "Coffee & Study Alem",
        type: "Local",
        email: "coffee@demo.estuclub.com",
        slug: "coffee-study",
        description: "Espacio de coworking y café de especialidad con descuentos para el club.",
        logoUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=200",
        address: "Av. San Martín 1540",
        location: {
            address: "Av. San Martín 1540",
            city: "Leandro N. Alem",
            lat: -27.5838,
            lng: -55.4754
        },
        deliveryEnabled: true,
        deliveryCost: 800,
        isVisible: true,
        isDemo: true
    },
    {
        id: "demo-cluber-clothes",
        name: "Urban Style Boutique",
        storeName: "Urban Style Boutique",
        type: "Comercio",
        email: "urban@demo.estuclub.com",
        slug: "urban-style",
        description: "Indumentaria urbana y deportiva con los mejores beneficios estudiantiles.",
        logoUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=200",
        address: "Calle Sarmiento 820",
        location: {
            address: "Calle Sarmiento 820",
            city: "Leandro N. Alem",
            lat: -27.5882,
            lng: -55.4721
        },
        isVisible: true,
        isDemo: true
    }
];

const DEMO_BENEFITS = [
    { title: '2x1 en Pizzas XL', description: 'Válido todos los jueves.', category: 'Gastronomía', points: 50, supplierId: 'demo-cluber-pizza', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800' },
    { title: 'Pase Libre Gym 7 Días', description: 'Pase de prueba para nuevos socios.', category: 'Bienestar', points: 200, supplierId: 'demo-cluber-gym', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800' },
    { title: 'Photocopy Pack x100', description: 'Válido para alumnos regulares.', category: 'Educación', points: 100, supplierId: 'demo-cluber-books', imageUrl: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=800' },
    { title: 'Combo Desayuno Estudclub', description: 'Café + 2 medialunas.', category: 'Gastronomía', points: 30, supplierId: 'demo-cluber-coffee', imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800' },
    { title: 'Hoodie Premium Estuclub', description: 'Diseño exclusivo Estuclub.', category: 'Indumentaria', points: 500, supplierId: 'demo-cluber-clothes', imageUrl: 'https://images.unsplash.com/photo-1556821921-25237307f920?w=800' }
];

// Generate exactly 25 professional benefits
for (let i = 0; i < 20; i++) {
    const supplier = DEMO_SUPPLIERS[i % DEMO_SUPPLIERS.length];
    DEMO_BENEFITS.push({
        title: `${["Descuento", "Regalo", "Promo", "VIP"][i % 4]} ${["Especial", "Estudiantil", "de Temporada", "Black"][i % 3]} #${i + 6}`,
        description: `Un beneficio exclusivo para socios en Leandro N. Alem. Válido en ${supplier.name}.`,
        points: (i + 1) * 25,
        category: supplier.type === "Comercio" ? "Gastronomía" : (supplier.type === "Salud" ? "Bienestar" : "Educación"),
        supplierId: supplier.id,
        imageUrl: `https://picsum.photos/seed/alem-${i}/800/600`
    });
}

const DEMO_ANNOUNCEMENTS = [
    { title: "🍕 Noche de Pizza 2x1", content: "¡Todos los jueves en Gastro Alem! Aprovecha nuestro 2x1 en pizzas grandes.", imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1200", supplierId: "demo-cluber-pizza" },
    { title: "🏋️ Promo Gym Verano", content: "¡Inscribite ahora en Titan Fitness y pagá la mitad de la inscripción!", imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200", supplierId: "demo-cluber-gym" },
    { title: "☕ Combo Estudiantil", content: "En Coffee & Study Alem: Café latte + 2 medialunas por solo $2.500.", imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1200", supplierId: "demo-cluber-coffee" }
];

const DEMO_BANNERS = [
    { title: "Banner Promo Pizza", imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1200", linkUrl: "/delivery" },
    { title: "Banner Gym Alem", imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200", linkUrl: "/turns" }
];

const DEMO_SERVICES = [
    { name: "Personal Trainer 1h", duration: 60, price: 5000, category: "Fitness", supplierId: "demo-cluber-gym", description: "Entrenamiento personalizado en Titan Fitness Alem." },
    { name: "Reserva de Mesa Cowork", duration: 120, price: 0, category: "Espacio", supplierId: "demo-cluber-coffee", description: "Reservá tu lugar para estudiar con el mejor internet." }
];

const DEMO_PRODUCTS = [
    { name: "Pizza Muzzarella Alem", price: 8500, category: "Pizzas", supplierId: "demo-cluber-pizza", description: "La clásica de la casa.", imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400" },
    { name: "Cappuccino Italiano", price: 2500, category: "Cafetería", supplierId: "demo-cluber-coffee", description: "Café de especialidad.", imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400" }
];

// --- PAGE COMPONENT ---


export default function AdminSeedPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState("");

    if (isUserLoading || !user) {
        return <SplashScreen />;
    }

    const handleSeedEverything = async () => {
        setIsLoading(true);
        try {
            // 1. Seed Suppliers
            setProgress("Creando Proveedores...");
            for (const s of DEMO_SUPPLIERS) {
                await setDoc(doc(firestore, 'roles_supplier', s.id), {
                    ...s,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    supplierName: s.name, // compatibility
                    storeName: s.name, // compatibility
                    address: s.address,
                }, { merge: true });
            }

            // 2. Seed Benefits
            setProgress("Poblando Beneficios (25)...");
            for (const b of DEMO_BENEFITS) {
                const s = DEMO_SUPPLIERS.find(sup => sup.id === b.supplierId);
                await addDoc(collection(firestore, 'benefits'), {
                    ...b,
                    supplierName: s?.name || "Demo Supplier",
                    isVisible: true,
                    isFeatured: Math.random() > 0.7,
                    redemptionCount: 0,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    isDemo: true
                });
            }

            // 3. Seed Announcements
            setProgress("Generando Anuncios Aprobados (10)...");
            for (const a of DEMO_ANNOUNCEMENTS) {
                const s = DEMO_SUPPLIERS.find(sup => sup.id === a.supplierId);
                await addDoc(collection(firestore, 'announcements'), {
                    ...a,
                    authorUsername: "Estuclub Admin",
                    status: 'approved',
                    isVisible: true,
                    submittedAt: serverTimestamp(),
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    isDemo: true
                });
            }

            // 4. Seed Banners (Static Ads)
            setProgress("Creando Banners Estáticos (3)...");
            for (const b of DEMO_BANNERS) {
                await addDoc(collection(firestore, 'banners'), {
                    ...b,
                    isActive: true,
                    isDemo: true,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }

            // 5. Seed Services (Turns)
            setProgress("Configurando Servicios de Turnos...");
            for (const serv of DEMO_SERVICES) {
                await addDoc(collection(firestore, 'services'), {
                    ...serv,
                    isActive: true,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    isDemo: true
                });
            }

            // 5. Seed Products (Delivery)
            setProgress("Cargando Menú de Delivery...");
            for (const p of DEMO_PRODUCTS) {
                await addDoc(collection(firestore, 'products'), {
                    ...p,
                    isActive: true,
                    stockAvailable: true,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    isDemo: true
                });
            }

            toast({ title: "Base de Datos Sembrada", description: "Se ha cargado todo el contenido demo con éxito." });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Error en Seeding" });
        } finally {
            setIsLoading(false);
            setProgress("");
        }
    };

    const handleClearDemoData = async () => {
        if (!confirm("Esto borrará todo el contenido marcado como DEMO. ¿Continuar?")) return;
        setIsLoading(true);
        try {
            const collections = ['benefits', 'announcements', 'services', 'products', 'banners'];
            let totalDeleted = 0;

            for (const coll of collections) {
                setProgress(`Limpiando ${coll}...`);
                const q = query(collection(firestore, coll), where('isDemo', '==', true));
                const snap = await getDocs(q);
                for (const d of snap.docs) {
                    await deleteDoc(d.ref);
                    totalDeleted++;
                }
            }
            
            setProgress("Limpiando Proveedores...");
            for (const s of DEMO_SUPPLIERS) {
                await deleteDoc(doc(firestore, 'roles_supplier', s.id));
                totalDeleted++;
            }

            toast({ title: "Limpieza Completada", description: `Se eliminaron ${totalDeleted} registros de prueba.` });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Error al limpiar" });
        } finally {
            setIsLoading(false);
            setProgress("");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 pb-32">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="flex justify-between items-center">
                    <BackButton />
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Master Seeding Tool</p>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Admin <span className="text-primary">Console</span></h1>
                    </div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    <Card className="md:col-span-2 rounded-[3.5rem] border-white/20 shadow-2xl overflow-hidden bg-white/70 backdrop-blur-xl">
                        <CardHeader className="p-10 pb-0">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
                                    <Sparkles className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-4xl font-black tracking-tighter italic uppercase">Sembrar <span className="text-primary">Mundo Estuclub</span></CardTitle>
                                    <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-40">Generación de entorno demo de alta fidelidad.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10 space-y-8">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <StatItem icon={<Building2 />} label="Proveedores" value="5" />
                                <StatItem icon={<Gift />} label="Beneficios" value="25" />
                                <StatItem icon={<Megaphone />} label="Anuncios" value="10" />
                                <StatItem icon={<Calendar />} label="Servicios" value="5" />
                            </div>

                            <div className="bg-primary/5 border border-primary/10 p-6 rounded-[2rem] space-y-3">
                                <p className="text-sm font-bold flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    Beneficios para el Usuario:
                                </p>
                                <ul className="text-xs space-y-2 opacity-60 font-medium list-disc ml-6">
                                    <li>Puebla el Home de Beneficios con carouseles llenos.</li>
                                    <li>Crea servicios reales para probar el sistema de Turnos.</li>
                                    <li>Habilita el flujo de Delivery con menús precargados.</li>
                                    <li>Llena el board de anuncios con contenido profesional.</li>
                                </ul>
                            </div>

                            {isLoading && (
                                <div className="p-4 bg-slate-900 rounded-2xl flex items-center gap-4 text-white font-mono text-xs">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    {progress}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Button 
                                    onClick={handleSeedEverything} 
                                    disabled={isLoading}
                                    className="h-20 flex-1 rounded-[1.5rem] bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-slate-800 transition-all border-none"
                                >
                                    {isLoading ? "Vibrando..." : "Sembrar Entorno Completo"}
                                </Button>
                                <Button 
                                    onClick={handleClearDemoData} 
                                    disabled={isLoading}
                                    variant="outline"
                                    className="h-20 px-10 rounded-[1.5rem] border-2 border-slate-200 font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-destructive hover:border-destructive transition-all"
                                >
                                    Limpiar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[3.5rem] border-white/20 shadow-xl bg-slate-900 text-white overflow-hidden flex flex-col">
                        <div className="p-8 pb-4">
                            <Package className="h-10 w-10 text-primary mb-4" />
                            <h3 className="text-xl font-black italic uppercase tracking-tighter">Preview <span className="text-primary">Pack</span></h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-4">
                            {DEMO_SUPPLIERS.map((s, i) => (
                                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${s.logoUrl})` }} />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase truncate">{s.name}</p>
                                        <p className="text-[8px] opacity-40 font-bold uppercase">{s.type}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-8 bg-black/20">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-center opacity-40">Ready to deploy high-fidelity assets</p>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="p-4 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-primary mb-2 opacity-50 scale-75">{icon}</div>
            <p className="text-2xl font-black italic tracking-tighter leading-none">{value}</p>
            <p className="text-[8px] font-bold uppercase tracking-widest opacity-30 mt-1">{label}</p>
        </div>
    );
}
