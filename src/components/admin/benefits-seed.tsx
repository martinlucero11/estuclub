'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function BenefitsSeed() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    if (!firestore) return;
    setIsSeeding(true);

    const batch = writeBatch(firestore);

    // --- 7 CLUBERS (SUPPLIERS) ---
    const suppliers = [
      {
        id: 'cafe-universitario',
        name: 'Café Universitario',
        email: 'ventas@cafeuni.com',
        type: 'Comercio',
        slug: 'cafe-universitario',
        description: 'Auténtico café italiano y pastelería artesanal para acompañar tus horas de estudio.',
        logoUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=200',
        coverUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200',
        address: 'Calle de la Facultad 123',
        whatsapp: '541100000001',
        isVisible: true,
        isFeatured: true,
        canCreateBenefits: true,
        deliveryEnabled: true,
        deliveryCategory: 'Bebidas',
        locationCoords: new GeoPoint(-34.6037, -58.3816),
        createdAt: serverTimestamp(),
      },
      {
        id: 'tech-store-estu',
        name: 'EstuTech Store',
        email: 'info@estutech.com',
        type: 'Comercio',
        slug: 'estutech-store',
        description: 'Hardware, software y accesorios con descuentos exclusivos para la comunidad universitaria.',
        logoUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca2c1b4?q=80&w=200',
        coverUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1200',
        address: 'Av. Tecnológica 999',
        whatsapp: '541100000002',
        isVisible: true,
        isFeatured: true,
        canCreateBenefits: true,
        deliveryEnabled: true,
        deliveryCategory: 'Otros',
        locationCoords: new GeoPoint(-34.6040, -58.3820),
        createdAt: serverTimestamp(),
      },
      {
        id: 'libreria-central',
        name: 'Librería Central',
        email: 'ventas@libcentral.com',
        type: 'Comercio',
        slug: 'libreria-central',
        description: 'Tu centro integral de copiado, librería y textos académicos.',
        logoUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=200',
        coverUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1200',
        address: 'Plaza de los Libros 45',
        whatsapp: '541100000003',
        isVisible: true,
        isFeatured: true,
        canCreateBenefits: true,
        deliveryEnabled: false,
        locationCoords: new GeoPoint(-34.6050, -58.3830),
        createdAt: serverTimestamp(),
      },
      {
        id: 'fit-student-gym',
        name: 'Fit Student Gym',
        email: 'fit@estuclub.com',
        type: 'Salud',
        slug: 'fit-student-gym',
        description: 'Entrenamiento funcional y máquinas de última generación cerca de tu facultad.',
        logoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200',
        coverUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1200',
        address: 'Gimnasio Universitario local 5',
        whatsapp: '541100000004',
        isVisible: true,
        isFeatured: true,
        canCreateBenefits: true,
        deliveryEnabled: false,
        locationCoords: new GeoPoint(-34.6060, -58.3840),
        createdAt: serverTimestamp(),
      },
      {
        id: 'estu-pizza',
        name: 'Estu-Pizza',
        email: 'delivery@estupizza.com',
        type: 'Comercio',
        slug: 'estu-pizza',
        description: 'La pizza preferida de los estudiantes. Abierto hasta tarde.',
        logoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200',
        coverUrl: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?q=80&w=1200',
        address: 'Av. Pizzas 123',
        whatsapp: '541100000005',
        isVisible: true,
        isFeatured: true,
        canCreateBenefits: true,
        deliveryEnabled: true,
        deliveryCategory: 'Comida Rápida',
        locationCoords: new GeoPoint(-34.6070, -58.3850),
        createdAt: serverTimestamp(),
      },
      {
        id: 'beauty-estu',
        name: 'Beauty Estu',
        email: 'beauty@estuclub.com',
        type: 'Estética',
        slug: 'beauty-estu',
        description: 'Barbería y estética con promociones exclusivas para alumnos.',
        logoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=200',
        coverUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200',
        address: 'Calle Estética 44',
        whatsapp: '541100000006',
        isVisible: true,
        isFeatured: true,
        canCreateBenefits: true,
        deliveryEnabled: false,
        locationCoords: new GeoPoint(-34.6080, -58.3860),
        createdAt: serverTimestamp(),
      },
      {
        id: 'cine-estu',
        name: 'Cine Estu',
        email: 'cine@estuclub.com',
        type: 'Entretenimiento',
        slug: 'cine-estu',
        description: 'Cine independiente y comercial con los mejores precios de la zona.',
        logoUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=200',
        coverUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1200',
        address: 'Paseo del Cine 10',
        whatsapp: '541100000007',
        isVisible: true,
        isFeatured: true,
        canCreateBenefits: true,
        deliveryEnabled: false,
        locationCoords: new GeoPoint(-34.6090, -58.3870),
        createdAt: serverTimestamp(),
      }
    ];

    // --- 15 BENEFITS (Perks) WITH LEVELS ---
    const perks = [
      // Cafe
      { id: 'p1', title: 'Café de Cortesía', description: 'Un café gratis al día por cada compra superior a $2000.', category: 'Comida', highlight: 'FREE', imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800', ownerId: 'cafe-universitario', points: 0, minLevel: 1, targetAudience: 'all' },
      { id: 'p2', title: '2x1 en Meriendas', description: 'Llevá dos meriendas completas al precio de una.', category: 'Comida', highlight: '2x1', imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=800', ownerId: 'cafe-universitario', points: 15, minLevel: 2, targetAudience: 'level_2' },
      
      // Tech
      { id: 'p3', title: 'Apple Education', description: '15% de descuento en toda la línea Mac y iPad.', category: 'Educación', highlight: '15% OFF', imageUrl: 'https://images.unsplash.com/photo-1517336712603-45727c975b2c?q=80&w=800', ownerId: 'tech-store-estu', points: 1000, minLevel: 3, targetAudience: 'level_3' },
      { id: 'p4', title: 'Accesorios Tech 30%', description: '30% OFF en fundas, cargadores y mouses.', category: 'Comercios', highlight: '30% OFF', imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=800', ownerId: 'tech-store-estu', points: 200, minLevel: 1, targetAudience: 'all' },
      
      // Bookstore
      { id: 'p5', title: 'Pack Fotocopias x100', description: 'Canjeá tus puntos por 100 fotocopias doble faz.', category: 'Educación', highlight: 'CANJE', imageUrl: 'https://images.unsplash.com/photo-1589187730032-c74881376044?q=80&w=800', ownerId: 'libreria-central', points: 350, minLevel: 1, targetAudience: 'all' },
      { id: 'p6', title: 'Art. de Librería 20%', description: 'Descuento en cuadernos, biromes y resaltadores.', category: 'Educación', highlight: '20% OFF', imageUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=800', ownerId: 'libreria-central', points: 100, minLevel: 1, targetAudience: 'all' },
      
      // Gym
      { id: 'p7', title: 'Pase Libre Mensual', description: 'Acceso ilimitado a máquinas y clases de fitness.', category: 'Entretenimiento', highlight: 'PASE', imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800', ownerId: 'fit-student-gym', points: 800, minLevel: 2, targetAudience: 'level_2' },
      { id: 'p8', title: 'Nutricionista Gratis', description: 'Una consulta mensual con nuestro especialista.', category: 'Salud', highlight: 'GRATIS', imageUrl: 'https://images.unsplash.com/photo-1571019623452-8d752a023b02?q=80&w=800', ownerId: 'fit-student-gym', points: 1500, minLevel: 3, targetAudience: 'cinco_dos' },
      
      // Pizza
      { id: 'p9', title: 'Pizza Grande PROMO', description: 'Ahorrá pidiendo una grande de Muzzarella.', category: 'Comida', highlight: '$8500', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800', ownerId: 'estu-pizza', points: 50, minLevel: 1, targetAudience: 'all' },
      { id: 'p10', title: 'Combo Estudiante', description: '2 porciones + Bebida de 500ml.', category: 'Comida', highlight: 'COMBO', imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800', ownerId: 'estu-pizza', points: 150, minLevel: 1, targetAudience: 'all' },
      
      // Beauty
      { id: 'p11', title: 'Corte Clásico', description: 'Servicio de peluquería para caballeros.', category: 'Estética', highlight: '$12000', imageUrl: 'https://images.unsplash.com/photo-1599351431247-f10bc1829375?q=80&w=800', ownerId: 'beauty-estu', points: 100, minLevel: 2, targetAudience: 'level_2' },
      { id: 'p12', title: 'Manicuría 50% OFF', description: 'Válido de Lunes a Miércoles.', category: 'Estética', highlight: '50% OFF', imageUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc2069?q=80&w=800', ownerId: 'beauty-estu', points: 400, minLevel: 1, targetAudience: 'all' },
      
      // Cinema
      { id: 'p13', title: 'Martes de Cine 2x1', description: 'En todas las salas y funciones.', category: 'Entretenimiento', highlight: '2x1', imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800', ownerId: 'cine-estu', points: 120, minLevel: 1, targetAudience: 'all' },
      { id: 'p14', title: 'Combo Pochoclos XL', description: 'Canjeá tus puntos por el balde de pochoclos.', category: 'Entretenimiento', highlight: 'FREE', imageUrl: 'https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?q=80&w=800', ownerId: 'cine-estu', points: 650, minLevel: 2, targetAudience: 'level_2' },
      { id: 'p15', title: 'Noche de Estrenos', description: 'Entrada gratuita a funciones de estreno.', category: 'Entretenimiento', highlight: 'GRATIS', imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1200', ownerId: 'cine-estu', points: 2000, minLevel: 3, targetAudience: 'level_3' },
    ];

    // --- ANNOUNCEMENTS ---
    const announcements = [
      { id: 'a1', supplierId: 'cafe-universitario', title: 'Nuevo Blend!', content: 'Probá el nuevo grano de Colombia.', imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200', status: 'approved', isVisible: true, createdAt: serverTimestamp() },
      { id: 'a2', supplierId: 'fit-student-gym', title: 'Zumba Masterclass', content: 'Este sábado a las 10hs en el patio central.', imageUrl: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?q=80&w=1200', status: 'approved', isVisible: true, createdAt: serverTimestamp() },
      { id: 'a3', supplierId: 'tech-store-estu', title: 'Llegó el nuevo iPhone!', content: 'Reservalo y pagalo en 12 cuotas.', imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=1200', status: 'approved', isVisible: true, createdAt: serverTimestamp() },
    ];

    try {
      suppliers.forEach(s => batch.set(doc(firestore, 'roles_supplier', s.id), s, { merge: true }));
      perks.forEach(p => batch.set(doc(firestore, 'perks', p.id), { ...p, createdAt: serverTimestamp() }, { merge: true }));
      announcements.forEach(a => batch.set(doc(firestore, 'announcements', a.id), a, { merge: true }));

      await batch.commit();
      toast({ title: 'Beneficios recreados', description: 'Se han creado 7 comercios y 15 beneficios con niveles.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Falló la creación de semillas.', variant: 'destructive' });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-primary/20 rounded-3xl bg-primary/5 space-y-4">
      <div className="flex items-center gap-3">
        <Sparkles className="w-8 h-8 text-primary" />
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter text-primary">Seed de Beneficios</h3>
          <p className="text-xs text-foreground">7 Comercios, 15 Beneficios por niveles.</p>
        </div>
      </div>
      <Button 
        onClick={handleSeed} 
        disabled={isSeeding} 
        className="w-full h-14 rounded-2xl font-black text-lg"
      >
        {isSeeding ? <Loader2 className="animate-spin" /> : 'GENERAR SEMILLAS DE BENEFICIOS'}
      </Button>
    </div>
  );
}

