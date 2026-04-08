'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Sparkles, Building2 } from 'lucide-react';
import BackButton from '@/components/layout/back-button';
import SplashScreen from '@/components/layout/splash-screen';

const ANNOUNCEMENTS_SEED = [
    {
        title: "🍕 Noche de Pizza 2x1",
        content: "¡Todos los jueves! Aprovecha nuestro 2x1 en pizzas grandes de cualquier sabor. Válido para retirar por el local o delivery propio.",
        imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1200",
        linkUrl: "/beneficios",
        isStudentOnly: false,
        minLevel: 1
    },
    {
        title: "🏋️ Promo Gym Verano",
        content: "¡No dejes para mañana lo que puedes entrenar hoy! Paga 3 meses por adelantado y obtén el 4to mes totalmente GRATIS.",
        imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200",
        linkUrl: "/beneficios",
        isStudentOnly: true,
        minLevel: 1
    },
    {
        title: "☕ Combo Estudiantil",
        content: "Café latte mediano + 2 medialunas por solo $2.500. Presenta tu certificado oficial en el mostrador.",
        imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1200",
        linkUrl: "",
        isStudentOnly: true,
        minLevel: 1
    },
    {
        title: "🍻 Happy Hour Extendido",
        content: "Extendemos nuestra felicidad: 2x1 en pintas seleccionadas de 18:00 a 21:00 hs. ¡Te esperamos en la terraza!",
        imageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=1200",
        linkUrl: "",
        isStudentOnly: false,
        minLevel: 2
    },
    {
        title: "🧘 Yoga al Amanecer",
        content: "Este sábado 09:00 hs clase gratuita de Vinyasa Yoga en el jardín. Trae tu mat y muchas ganas de conectar.",
        imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200",
        linkUrl: "/turnos",
        isStudentOnly: false,
        minLevel: 1
    },
    {
        title: "🍔 Burger del Mes",
        content: "Prueba la nueva 'EstuCluber Burger': Doble smash, cheddar ahumado, cebolla caramelizada y salsa secreta.",
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=1200",
        linkUrl: "/delivery",
        isStudentOnly: false,
        minLevel: 1
    },
    {
        title: "📚 Fotocopias al Costo",
        content: "Durante toda la semana de finales, todas las impresiones y copias en blanco y negro a mitad de precio para miembros Premium.",
        imageUrl: "https://images.unsplash.com/photo-1562654501-a0ccc0af3fb1?auto=format&fit=crop&q=80&w=1200",
        linkUrl: "",
        isStudentOnly: true,
        minLevel: 4
    },
    {
        title: "👟 Outlet Zapatillas",
        content: "¡Liquidación total! Hasta 40% de descuento en modelos seleccionados de temporadas anteriores. ¡Vuelan!",
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1200",
        linkUrl: "",
        isStudentOnly: false,
        minLevel: 2
    },
    {
        title: "💻 Service Express",
        content: "Mantenimiento preventivo de notebooks en menos de 24hs. 20% OFF para estudiantes de sistemas.",
        imageUrl: "https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=1200",
        linkUrl: "",
        isStudentOnly: true,
        minLevel: 3
    },
    {
        title: "🎟️ Sorteo VIP",
        content: "Gana un pase doble para el festival del mes que viene. Participas automáticamente con cada canje de beneficios.",
        imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200",
        linkUrl: "",
        isStudentOnly: false,
        minLevel: 1
    }
];

export default function SeedPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    if (isUserLoading || !user) {
        return <SplashScreen />;
    }

    const handleSeed = async () => {
        setIsLoading(true);
        try {
            let count = 0;
            for (const item of ANNOUNCEMENTS_SEED) {
                await addDoc(collection(firestore, 'announcements'), {
                    ...item,
                    supplierId: user.uid,
                    authorUsername: user.displayName || user.email || 'Admin',
                    status: 'approved',
                    isVisible: true,
                    submittedAt: serverTimestamp(),
                    createdAt: serverTimestamp(),
                });
                count++;
            }
            toast({ title: "Sembrado completado", description: `Se crearon ${count} anuncios para tu local.` });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Error al sembrar", description: "Revisa la consola para más detalles." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = async () => {
        if (!confirm("¿Estás seguro de que quieres borrar TODOS tus anuncios?")) return;
        setIsLoading(true);
        try {
            const q = query(collection(firestore, 'announcements'), where('supplierId', '==', user.uid));
            const snapshot = await getDocs(q);
            let count = 0;
            for (const docSnap of snapshot.docs) {
                await deleteDoc(docSnap.ref);
                count++;
            }
            toast({ title: "Limpieza completada", description: `Se eliminaron ${count} anuncios.` });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Error al limpiar" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <BackButton />
            <Card className="glass overflow-hidden border-primary/20 shadow-premium">
                <CardHeader className="bg-primary/10 border-b border-primary/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary rounded-xl">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black italic">Seeding de Anuncios</CardTitle>
                            <CardDescription>Genera contenido de prueba de alta fidelidad para tu panel.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl flex gap-3 text-yellow-700">
                        <Building2 className="h-5 w-5 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-bold">Identidad del Proveedor:</p>
                            <p className="font-mono text-xs opacity-70">{user.uid}</p>
                            <p className="mt-2">Los anuncios se crearán vinculados a este ID para cumplir con las reglas de seguridad de Firestore.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button 
                            onClick={handleSeed} 
                            disabled={isLoading}
                            size="lg"
                            className="h-24 text-lg font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20"
                        >
                            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-6 w-6" />}
                            Sembrar 10 Anuncios
                        </Button>
                        <Button 
                            onClick={handleClear} 
                            disabled={isLoading}
                            variant="destructive"
                            size="lg"
                            className="h-24 text-lg font-black uppercase tracking-widest shadow-xl shadow-destructive/20"
                        >
                            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Trash2 className="mr-2 h-6 w-6" />}
                            Borrar Todo
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 opacity-50">
                <h3 className="font-bold text-sm uppercase tracking-widest text-center">Vista Previa del Contenido</h3>
                {ANNOUNCEMENTS_SEED.slice(0, 3).map((item, i) => (
                    <div key={i} className="glass p-3 rounded-xl flex gap-3 items-center">
                        <div className="h-12 w-12 rounded-lg bg-cover bg-center shrink-0 border border-white/10" style={{ backgroundImage: `url(${item.imageUrl})` }} />
                        <div className="min-w-0">
                            <p className="font-bold text-xs truncate">{item.title}</p>
                            <p className="text-[10px] line-clamp-1">{item.content}</p>
                        </div>
                    </div>
                ))}
                <p className="text-center text-[10px]">... y 7 anuncios más con categorías premium.</p>
            </div>
        </div>
    );
}
