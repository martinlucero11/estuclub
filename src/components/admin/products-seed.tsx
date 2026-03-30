'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, PackageOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ProductsSeed() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    if (!firestore) return;
    setIsSeeding(true);

    const batch = writeBatch(firestore);

    const products = [
      // ============================================
      // CAFE UNIVERSITARIO (ID: 'cafe-universitario')
      // ============================================
      {
        id: 'prod-cafe-1', supplierId: 'cafe-universitario', category: 'Cafetería Clásica',
        name: 'Espresso Doble', description: 'Doble shot de espresso de grano arábica con notas de cacao.',
        price: 2500, originalPrice: 2800, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=600',
      },
      {
        id: 'prod-cafe-2', supplierId: 'cafe-universitario', category: 'Cafetería Clásica',
        name: 'Latte Macchiato', description: 'Café suave con abundante leche vaporizada y capa de espuma.',
        price: 3200, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668aa44f76?q=80&w=600',
      },
      {
        id: 'prod-cafe-3', supplierId: 'cafe-universitario', category: 'Combinados',
        name: 'Caramel Frappé', description: 'Batido frío de café con caramelo y crema batida.',
        price: 4500, originalPrice: 5000, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1629859239719-ea9aebc72175?q=80&w=600',
      },
      {
        id: 'prod-cafe-4', supplierId: 'cafe-universitario', category: 'Pastelería',
        name: 'Medialunas de Manteca (x3)', description: 'Clásicas medialunas artesanales recién horneadas.',
        price: 2400, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1549903072-7e6e0d238053?q=80&w=600',
      },
      {
        id: 'prod-cafe-5', supplierId: 'cafe-universitario', category: 'Pastelería',
        name: 'Cheesecake Frutos Rojos', description: 'Porción individual de cheesecake tipo New York.',
        price: 5200, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=600',
      },
      {
        id: 'prod-cafe-6', supplierId: 'cafe-universitario', category: 'Pastelería',
        name: 'Muffin de Arándanos', description: 'Muffin esponjoso relleno y decorado con arándanos frescos.',
        price: 2800, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1558401391-7899b4bd5bbf?q=80&w=600',
      },
      {
        id: 'prod-cafe-7', supplierId: 'cafe-universitario', category: 'Salados',
        name: 'Tostado de Miga JyQ', description: 'Tostado de jamón natural y queso en pan de miga especial.',
        price: 4000, originalPrice: 4500, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1528735602780-25fc2f3a695e?q=80&w=600',
      },
      {
        id: 'prod-cafe-8', supplierId: 'cafe-universitario', category: 'Salados',
        name: 'Bagel de Salmón', description: 'Bagel con semillas, salmón ahumado y queso crema a las finas hierbas.',
        price: 8500, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1508244033100-2e4000f22f7b?q=80&w=600',
      },

      // ============================================
      // ESTUTECH STORE (ID: 'tech-store-estu')
      // ============================================
      {
        id: 'prod-tech-1', supplierId: 'tech-store-estu', category: 'Periféricos',
        name: 'Mouse Inalámbrico Logitech', description: 'Mouse óptico inalámbrico 2.4Ghz. Diseño ergonómico.',
        price: 18000, originalPrice: 22000, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=600',
      },
      {
        id: 'prod-tech-2', supplierId: 'tech-store-estu', category: 'Periféricos',
        name: 'Teclado Mecánico RGB', description: 'Teclado mecánico con switches red, retroiluminación RGB.',
        price: 45000, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=600',
      },
      {
        id: 'prod-tech-3', supplierId: 'tech-store-estu', category: 'Audio',
        name: 'Auriculares Bluetooth In-Ear', description: 'Auriculares TWS con cancelación de ruido activa.',
        price: 32000, originalPrice: 38000, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600',
      },
      {
        id: 'prod-tech-4', supplierId: 'tech-store-estu', category: 'Audio',
        name: 'Auriculares Headset Gamer', description: 'Cerrados con micrófono integrado y conexión USB.',
        price: 55000, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=600',
      },
      {
        id: 'prod-tech-5', supplierId: 'tech-store-estu', category: 'Almacenamiento',
        name: 'Pendrive Kingston 64GB', description: 'Memoria USB 3.2 de gran resistencia y velocidad.',
        price: 9500, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1558227092-4fcf1cbb8a04?q=80&w=600',
      },
      {
        id: 'prod-tech-6', supplierId: 'tech-store-estu', category: 'Almacenamiento',
        name: 'Disco Externo SSD 1TB', description: 'Disco sólido externo con cable USB-C. Súper rápido.',
        price: 98000, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1616421330368-ffde1168924f?q=80&w=600',
      },
      {
        id: 'prod-tech-7', supplierId: 'tech-store-estu', category: 'Cables & Carga',
        name: 'Cargador de Pared 20W USB-C', description: 'Cargador rápido ideal para smartphones de última generación.',
        price: 15000, originalPrice: 18500, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=600',
      },
      {
        id: 'prod-tech-8', supplierId: 'tech-store-estu', category: 'Cables & Carga',
        name: 'Cable USB-C a USB-C Trenzado 2m', description: 'Alta durabilidad, soporta transferencia de datos y carga rápida.',
        price: 8000, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1610408546197-e85df649e776?q=80&w=600',
      },

      // ============================================
      // ESTU-PIZZA (ID: 'estu-pizza')
      // ============================================
      {
        id: 'prod-pizza-1', supplierId: 'estu-pizza', category: 'Pizzas (Grandes)',
        name: 'Muzzarella Tradicional', description: 'Salsa de tomate casera, muzzarella abundante y orégano.',
        price: 9500, originalPrice: 11000, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=600',
      },
      {
        id: 'prod-pizza-2', supplierId: 'estu-pizza', category: 'Pizzas (Grandes)',
        name: 'Napolitana Al Ajo', description: 'Muzzarella, rodajas de tomate, provenzal y un toque de parmesano.',
        price: 11500, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1571066811602-716837d681de?q=80&w=600',
      },
      {
        id: 'prod-pizza-3', supplierId: 'estu-pizza', category: 'Pizzas (Grandes)',
        name: 'Fugazzeta Especial', description: 'Masa gruesa rellena de muzzarella, mucha cebolla y parmesano gratinado.',
        price: 13000, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600',
      },
      {
        id: 'prod-pizza-4', supplierId: 'estu-pizza', category: 'Empanadas',
        name: 'Docena de Empanadas (Carne/Jamón y Queso)', description: 'Horneadas. Podés pedir variedad tradicional.',
        price: 13500, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1626200419189-3b58eb14af15?q=80&w=600',
      },
      {
        id: 'prod-pizza-5', supplierId: 'estu-pizza', category: 'Combos Universitarios',
        name: 'Combo "No llego al Final"', description: 'Muzzarella chica (4 porciones) + 2 Empanadas a elección + Bebida de 1.5L',
        price: 11000, originalPrice: 13500, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600',
      },
      {
        id: 'prod-pizza-6', supplierId: 'estu-pizza', category: 'Sandwiches',
        name: 'Lomito Completo con Papas', description: 'Pan francés, bife de lomo, jamón, queso, lechuga, tomate, huevo y papas fritas.',
        price: 12000, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1627993478950-84cbfebdfbf2?q=80&w=600',
      },
      {
        id: 'prod-pizza-7', supplierId: 'estu-pizza', category: 'Postres',
        name: 'Flan Mixto', description: 'Flan casero con una bocha generosa de dulce de leche y crema.',
        price: 3500, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1559850607-bb7cb5f985a6?q=80&w=600',
      },
      {
        id: 'prod-pizza-8', supplierId: 'estu-pizza', category: 'Bebidas',
        name: 'Coca Cola 1.5L', description: 'Gaseosa sabor original bien fría.',
        price: 2800, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=600',
      },
      {
        id: 'prod-pizza-9', supplierId: 'estu-pizza', category: 'Bebidas',
        name: 'Cerveza Patagonia 730ml', description: 'Cerveza artesanal. Diferentes estilos a disponibilidad según stock.',
        price: 4500, originalPrice: 5000, stockAvailable: true, isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1614316335133-c5bdfea31bc1?q=80&w=600',
      }
    ];

    try {
      products.forEach(product => {
        batch.set(doc(firestore, 'products', product.id), {
            ...product,
            createdAt: serverTimestamp()
        }, { merge: true });
      });

      await batch.commit();
      toast({ title: 'Productos generados', description: 'Se han creado 25 productos simulados para el Delivery.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Falló la generacion de productos.', variant: 'destructive' });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-primary/20 rounded-3xl bg-secondary/5 space-y-4">
      <div className="flex items-center gap-3">
        <PackageOpen className="w-8 h-8 text-primary" />
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter text-primary">Seed de Productos Delivery</h3>
          <p className="text-xs text-muted-foreground">Crea 25 productos repartidos en 3 comercios con Delivery.</p>
        </div>
      </div>
      <Button 
        onClick={handleSeed} 
        disabled={isSeeding} 
        variant="secondary"
        className="w-full h-14 rounded-2xl font-black text-lg border-2 border-primary/20"
      >
        {isSeeding ? <Loader2 className="animate-spin" /> : 'GENERAR SEMILLAS DE PRODUCTOS'}
      </Button>
    </div>
  );
}
