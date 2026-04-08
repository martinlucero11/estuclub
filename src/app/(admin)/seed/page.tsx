'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/main-layout';
import { BenefitsSeed } from '@/components/admin/benefits-seed';
import { ProductsSeed } from '@/components/admin/products-seed';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, Loader2, Database } from 'lucide-react';

export default function SeedPage() {
  const firestore = useFirestore();
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeed = async () => {
    if (!firestore) return;
    setIsSeeding(true);
    setResult(null);

    const batch = writeBatch(firestore);

    // --- SAMPLE CLUBERS (Suppliers) ---
    const suppliers = [
      {
        id: 'cafe-la-plaza',
        name: 'Café de la Plaza',
        email: 'info@cafelaplaza.com',
        type: 'Comercio',
        slug: 'cafe-la-plaza',
        description: 'Auténtico café de especialidad, pastelería artesanal y el mejor ambiente para estudiar o relajarte.',
        logoUrl: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?q=80&w=400',
        coverUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200',
        address: 'Av. Juan B. Justo 450, CABA',
        whatsapp: '541199887766',
        isVisible: true,
        isFeatured: true,
        featuredRank: 1,
        permitsBenefits: true,
        announcementsEnabled: true,
        createdAt: serverTimestamp(),
      },
      {
        id: 'gym-fitlife',
        name: 'Gym FitLife',
        email: 'contacto@gymfitlife.com',
        type: 'Salud',
        slug: 'gym-fitlife',
        description: 'Tu lugar para transformar tu cuerpo y mente. Equipamiento de última generación y clases grupales.',
        logoUrl: 'https://images.unsplash.com/photo-1571019623452-8d752a023b02?q=80&w=400',
        coverUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200',
        address: 'Calle Corrientes 1200, CABA',
        whatsapp: '541122334455',
        isVisible: true,
        isFeatured: true,
        featuredRank: 2,
        permitsBenefits: true,
        announcementsEnabled: true,
        createdAt: serverTimestamp(),
      },
      {
        id: 'estilo-propio',
        name: 'Estilo Propio',
        email: 'barber@estilopropio.com',
        type: 'Estética',
        slug: 'estilo-propio',
        description: 'Barbería y Peluquería de vanguardia. Vení a renovar tu look con los mejores profesionales.',
        logoUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400',
        coverUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200',
        address: 'Santa Fe 2100, CABA',
        whatsapp: '541133445566',
        isVisible: true,
        isFeatured: true,
        featuredRank: 3,
        permitsBenefits: true,
        announcementsEnabled: true,
        createdAt: serverTimestamp(),
      },
      {
        id: 'tech-point',
        name: 'Tech Point',
        email: 'ventas@techpoint.com',
        type: 'Comercio',
        slug: 'tech-point',
        description: 'Todo en tecnología, accesorios para celular, computación y servicio técnico especializado.',
        logoUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=400',
        coverUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1200',
        address: 'Florida 150, CABA',
        whatsapp: '541144556677',
        isVisible: true,
        isFeatured: true,
        featuredRank: 4,
        permitsBenefits: true,
        announcementsEnabled: true,
        createdAt: serverTimestamp(),
      }
    ];

    suppliers.forEach((s) => {
      const ref = doc(firestore, 'roles_supplier', s.id);
      batch.set(ref, s, { merge: true });
    });

    // --- SAMPLE BENEFITS (Perks) ---
    const perks = [
      {
        id: 'perk-cafe-1',
        title: '2x1 en Café de Especialidad',
        description: 'Disfrutá de un excelente café 2x1 todos los días de la semana para empezar el día con todo. Válido para llevar o consumir en el local.',
        category: 'Comida',
        highlight: '2x1',
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200',
        location: 'Av. Juan B. Justo 450',
        ownerId: 'cafe-la-plaza',
        supplierName: 'Café de la Plaza',
        points: 50,
        isVisible: true,
        isFeatured: true,
        active: true,
        createdAt: serverTimestamp(),
      },
      {
        id: 'perk-gym-1',
        title: 'Semana de Entrenamiento Gratis',
        description: 'Vení a probar nuestras instalaciones por una semana sin cargo. Incluye acceso a sala de pesas y todas las clases grupales.',
        category: 'Entretenimiento',
        highlight: 'FREE',
        imageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1200',
        location: 'Calle Corrientes 1200',
        ownerId: 'gym-fitlife',
        supplierName: 'Gym FitLife',
        points: 100,
        isVisible: true,
        isFeatured: true,
        active: true,
        createdAt: serverTimestamp(),
      },
      {
        id: 'perk-barber-1',
        title: '20% OFF en Corte de Cabello',
        description: 'Presentando tu credencial de Estuclub tenés un 20% de descuento en tu primer corte. ¡Te esperamos!',
        category: 'Estética',
        highlight: '20% OFF',
        imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200',
        location: 'Santa Fe 2100',
        ownerId: 'estilo-propio',
        supplierName: 'Estilo Propio',
        points: 30,
        isVisible: true,
        isFeatured: true,
        active: true,
        createdAt: serverTimestamp(),
      },
      {
        id: 'perk-tech-1',
        title: '15% OFF en Accesorios Seleccionados',
        description: 'Descuento especial en fundas, protectores de pantalla y periféricos de PC. No acumulable con otras promos.',
        category: 'Comercios',
        highlight: '15% OFF',
        imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=1200',
        location: 'Florida 150',
        ownerId: 'tech-point',
        supplierName: 'Tech Point',
        points: 40,
        isVisible: true,
        isFeatured: true,
        active: true,
        createdAt: serverTimestamp(),
      }
    ];

    perks.forEach((p) => {
      const ref = doc(firestore, 'benefits', p.id);
      batch.set(ref, p, { merge: true });
    });

    // --- SAMPLE ANNOUNCEMENTS ---
    const announcements = [
      {
        id: 'ann-gym-1',
        supplierId: 'gym-fitlife',
        title: '¡Nueva Sala de Yoga!',
        content: 'Estamos muy contentos de anunciar que abrimos una nueva sala exclusiva para clases de Yoga y Pilates con vista a la ciudad. ¡Vení a conocerla!',
        imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200',
        status: 'approved',
        isVisible: true,
        authorUsername: 'GymFitLife',
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      {
        id: 'ann-cafe-1',
        supplierId: 'cafe-la-plaza',
        title: 'Noche de Brunch y Música',
        content: 'Este viernes extendemos nuestro horario. Vení a disfrutar de un brunch especial acompañado de música acústica en vivo.',
        imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1200',
        status: 'approved',
        isVisible: true,
        authorUsername: 'CafePlaza',
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      {
        id: 'ann-tech-1',
        supplierId: 'tech-point',
        title: 'Llegaron los nuevos periféricos Gamer',
        content: 'Ya tenemos stock de las últimas marcas en teclados mecánicos y mouses. ¡Vení a probarlos al local!',
        imageUrl: 'https://images.unsplash.com/photo-1527690718360-ec5720d7c9ee?q=80&w=1200',
        status: 'approved',
        isVisible: true,
        authorUsername: 'TechPointHero',
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }
    ];

    announcements.forEach((a) => {
      const ref = doc(firestore, 'announcements', a.id);
      batch.set(ref, a, { merge: true });
    });

    try {
      await batch.commit();
      setResult({ success: true, message: '¡Datos de prueba generados con éxito!' });
    } catch (error) {
      console.error('Error seeding data:', error);
      setResult({ success: false, message: 'Error al generar los datos. Revisa la consola.' });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto p-4 py-12 min-h-[70vh] flex items-center justify-center">
        <Card className="w-full shadow-2xl border-primary/10 glass glass-dark rounded-[2.5rem] overflow-hidden">
          <CardHeader className="text-center space-y-2 pb-8 pt-10">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-4">
               <Database className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight uppercase">Base de Datos</CardTitle>
            <CardDescription className="text-lg font-medium italic opacity-60">Popula tu aplicación con datos de prueba premium.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pb-12 px-10">
            <BenefitsSeed />
            <ProductsSeed />
            
            <div className="space-y-4 bg-primary/5 rounded-3xl p-6 border border-primary/10">
                <h3 className="font-black text-xs uppercase tracking-widest text-primary">¿Qué datos se añadirán con el Seed General?</h3>
                <ul className="space-y-2 text-sm font-medium">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 4 Clubers (Proveedores)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 4 Beneficios (Perks) destacados</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 3 Anuncios aprobados</li>
                </ul>
                <p className="text-[10px] text-foreground italic pt-2">No se borrarán datos existentes. Se usarán las categorías actuales.</p>
            </div>

            <Button 
              onClick={handleSeed} 
              disabled={isSeeding}
              className="w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group"
            >
              {isSeeding ? (
                <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Generando...
                </>
              ) : (
                'Generar Datos de Prueba'
              )}
            </Button>

            {result && (
              <div className={`p-4 rounded-2xl text-center font-bold animate-in fade-in slide-in-from-bottom-2 ${result.success ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
                {result.message}
              </div>
            )}

            {result?.success && (
                <p className="text-center text-xs text-foreground animate-pulse">
                    Ya podés volver al Home para ver los cambios.
                </p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}


