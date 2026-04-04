'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, setDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Sparkles, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function SeedPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const runSeed = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      // 1. SEED SUPPLIERS (roles_supplier)
      const suppliers = [
        {
          id: 'estuclub-barber-id',
          name: 'Estuclub Barber',
          email: 'barber@estuclub.com',
          type: 'Estética',
          slug: 'estuclub-barber',
          description: 'La barbería oficial del club. Estilo clásico con el toque moderno de Estuclub.',
          logoUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400',
          coverUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200',
          address: 'Av. Colón 1234, Córdoba',
          whatsapp: '5493510000000',
          isVisible: true,
          isFeatured: true,
          appointmentsEnabled: true,
          deliveryEnabled: true,
          deliveryCategory: 'Otros',
          isCincoDos: true,
          createdAt: serverTimestamp(),
        },
        {
          id: 'medica-express-id',
          name: 'Médica Express',
          email: 'salud@estuclub.com',
          type: 'Salud',
          slug: 'medica-express',
          description: 'Consultas médicas rápidas para estudiantes de alta demanda.',
          logoUrl: 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?q=80&w=400',
          address: 'Belgrano 456, Córdoba',
          isVisible: true,
          isFeatured: false,
          appointmentsEnabled: true,
          createdAt: serverTimestamp(),
        },
        {
          id: 'taller-master-id',
          name: 'Taller Tech Master',
          email: 'taller@estuclub.com',
          type: 'Servicios',
          slug: 'taller-tech',
          description: 'Reparación de celulares y notebooks en el acto.',
          logoUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=400',
          address: 'Duarte Quirós 800, Córdoba',
          isVisible: true,
          isFeatured: false,
          appointmentsEnabled: true,
          createdAt: serverTimestamp(),
        }
      ];

      for (const s of suppliers) {
        await setDoc(doc(firestore, 'roles_supplier', s.id), s);
      }

      // 2. SEED BENEFITS (perks)
      const perks = [
        {
          id: 'perk-barber-1',
          supplierId: 'estuclub-barber-id',
          supplierName: 'Estuclub Barber',
          title: 'Corte Estudiantil 2x1',
          description: 'Vení con un amigo y pagá solo la mitad cada uno. Válido de Lunes a Jueves.',
          highlight: 'ESTUDIANTIL',
          imageUrl: 'https://images.unsplash.com/photo-1532710093739-9470acff00bc?q=80&w=800',
          category: 'Otros',
          points: 100,
          isVisible: true,
          isFeatured: true,
          isStudentOnly: true,
          createdAt: serverTimestamp(),
        },
        {
          id: 'perk-barber-2',
          supplierId: 'estuclub-barber-id',
          supplierName: 'Estuclub Barber',
          title: 'Afeitado + Barba 20% OFF',
          description: 'Afeitado tradicional a navaja y diseño de barba con productos premium.',
          highlight: 'PROMO BARBA',
          imageUrl: 'https://images.unsplash.com/photo-1621605815841-28d944f33bb4?q=80&w=800',
          category: 'Otros',
          points: 50,
          isVisible: true,
          isFeatured: false,
          isStudentOnly: false,
          createdAt: serverTimestamp(),
        },
        {
          id: 'perk-medica-1',
          supplierId: 'medica-express-id',
          supplierName: 'Médica Express',
          title: 'Apto Físico Universitario',
          description: 'Certificado rápido para deportes y gimnasia universitaria.',
          imageUrl: 'https://images.unsplash.com/photo-1576091160550-217359f4ecf8?q=80&w=800',
          category: 'Salud',
          points: 200,
          isVisible: true,
          isFeatured: true,
          createdAt: serverTimestamp(),
        },
        {
          id: 'perk-taller-1',
          supplierId: 'taller-master-id',
          supplierName: 'Taller Tech Master',
          title: 'Service Completo Notebook',
          description: 'Limpieza, cambio de pasta térmica y optimización de software por un precio exclusivo.',
          imageUrl: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?q=80&w=800',
          category: 'Servicios',
          isVisible: true,
          isFeatured: true,
          createdAt: serverTimestamp(),
        }
      ];

      for (const p of perks) {
        await setDoc(doc(firestore, 'perks', p.id), p);
      }

      // 3. SEED PRODUCTS (Barber only)
      const products = [
        {
          id: 'prod-barber-1',
          supplierId: 'estuclub-barber-id',
          name: 'Pomada Estuclub Matte',
          description: 'Fijación fuerte, acabado mate natural. 100gr.',
          price: 3500,
          imageUrl: 'https://images.unsplash.com/photo-1559599189-fe84dea4eb79?q=80&w=600',
          category: 'Estética',
          isActive: true,
          stockAvailable: true,
          createdAt: serverTimestamp(),
        },
        {
          id: 'prod-barber-2',
          supplierId: 'estuclub-barber-id',
          name: 'Aceite Nutritivo Barba',
          description: 'Esencia de cedro y eucalipto. Hidratación extrema.',
          price: 2800,
          imageUrl: 'https://images.unsplash.com/photo-1590159413217-062e7f864e26?q=80&w=600',
          category: 'Estética',
          isActive: true,
          stockAvailable: true,
          createdAt: serverTimestamp(),
        }
      ];

      for (const pr of products) {
        await setDoc(doc(firestore, 'products', pr.id), pr);
      }

      // 4. ANNOUNCEMENTS (Barber)
      const announcements = [
        {
          id: 'ann-barber-1',
          supplierId: 'estuclub-barber-id',
          authorUsername: 'Estuclub Barber',
          title: 'Abrimos este Feriado',
          content: 'El Lunes de 10:00 a 16:00 hs estaremos atendiendo por orden de llegada y turnos.',
          imageUrl: 'https://images.unsplash.com/photo-1512690196236-d5a23223336c?q=80&w=800',
          status: 'approved',
          isVisible: true,
          submittedAt: serverTimestamp(),
        }
      ];

      for (const a of announcements) {
        await setDoc(doc(firestore, 'announcements', a.id), a);
      }

      // 5. ORDERS (Dummy)
      const orders = [
        {
          id: 'order-dummy-1',
          shortId: 'EST-1234',
          customerId: 'test-user-id',
          customerName: 'Martín Pérez',
          customerPhone: '3511234567',
          supplierId: 'estuclub-barber-id',
          supplierName: 'Estuclub Barber',
          items: [{ productId: 'prod-barber-1', name: 'Pomada Estuclub Matte', price: 3500, quantity: 1 }],
          subtotal: 3500,
          deliveryFee: 1400,
          total: 4900,
          status: 'delivered',
          paymentMethod: 'cash_at_door',
          paymentStatus: 'paid',
          deliveryAddress: 'Ituzaingó 123, Nueva Córdoba',
          deliveryCoords: { latitude: -31.43, longitude: -64.18 },
          type: 'delivery',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }
      ];

      for (const o of orders) {
        await setDoc(doc(firestore, 'orders', o.id), o);
      }

      toast({ title: 'Seed completado', description: 'Los datos han sido creados correctamente.' });
      setDone(true);
    } catch (error: any) {
      console.error('Error in seed:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-10 rounded-[3.5rem] border-white/10 shadow-3xl bg-card/50 backdrop-blur-3xl border-2 flex flex-col items-center text-center gap-8 animate-in fade-in zoom-in duration-700">
        <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center border-4 border-primary/20 shadow-2xl shadow-primary/20">
          <Database className="h-10 w-10 text-primary" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
            Database <span className="text-primary italic">Seeder</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 leading-relaxed">
            Pobla tu entorno con datos de prueba premium para Estuclub Barber y tableros de turnos.
          </p>
        </div>

        <div className="w-full space-y-4">
          <Button 
            onClick={runSeed} 
            disabled={loading || done}
            className="w-full h-16 rounded-2xl bg-primary text-white font-black stroke-white uppercase tracking-widest text-xs shadow-xl transition-all hover:scale-105 active:scale-[0.98] group"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : done ? (
              <CheckCircle2 className="h-5 w-5 mr-2" />
            ) : (
              <Sparkles className="h-5 w-5 mr-2" />
            )}
            {loading ? 'Sincronizando...' : done ? 'Base de datos cargada' : 'Ejecutar Carga de Prueba'}
          </Button>

          {done && (
            <div className="flex flex-col gap-2 animate-in slide-in-from-top-4 duration-500">
               <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 py-2 rounded-xl border border-green-500/20">
                  <CheckCircle2 className="h-3 w-3" /> ¡Todo listo!
               </div>
               <Link href="/" className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline pt-4">
                  VOLVER AL INICIO <ArrowRight className="h-3 w-3" />
               </Link>
            </div>
          )}

          {!done && !loading && (
             <div className="flex items-start gap-3 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 text-left">
                <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-[9px] font-bold text-yellow-500/70 leading-relaxed">
                   Esta acción enviará datos a la colección de roles_supplier, perks, products y orders. Se utilizarán IDs fijos para evitar duplicados.
                </p>
             </div>
          )}
        </div>
      </Card>
    </div>
  );
}
