'use client';

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';

const DEMO_SUPPLIERS = [
  {
    id: 'demo-supplier-1',
    name: 'El Galpón de Alem',
    email: 'contacto@elgalpon.com',
    type: 'Comercio',
    slug: 'el-galpon',
    description: 'Parilla y minutas tradicionales en el corazón de Alem. Calidad misionera.',
    logoUrl: 'https://images.unsplash.com/photo-1544333346-645472890451?q=80&w=800', // Grill/Food logo style
    address: 'Av. Belgrano 450, Alem, Misiones',
    isVisible: true,
    isFeatured: true,
    location: {
      lat: -27.6033,
      lng: -55.3217,
      address: 'Av. Belgrano 450, Alem, Misiones'
    }
  },
  {
    id: 'demo-supplier-2',
    name: 'Alem Fitness Center',
    email: 'fitness@alem.com',
    type: 'Salud',
    slug: 'alem-fitness',
    description: 'Tu centro de entrenamiento integral. Musculación, Cross y mucho más.',
    logoUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=800',
    address: 'Calle Sarmiento 120, Alem, Misiones',
    isVisible: true,
    isFeatured: false,
    location: {
      lat: -27.6025,
      lng: -55.3235,
      address: 'Calle Sarmiento 120, Alem, Misiones'
    }
  },
  {
    id: 'demo-supplier-3',
    name: 'Tienda Misionerita',
    email: 'hola@misionerita.com',
    type: 'Comercio',
    slug: 'misionerita',
    description: 'Regionales, artesanías y lo mejor de nuestra tierra colorada.',
    logoUrl: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?q=80&w=800',
    address: 'Ruta 14 Km 845, Alem, Misiones',
    isVisible: true,
    isFeatured: true,
    location: {
      lat: -27.6060,
      lng: -55.3180,
      address: 'Ruta 14 Km 845, Alem, Misiones'
    }
  },
  {
    id: 'demo-supplier-4',
    name: 'Farmacia del Pueblo',
    email: 'farmacia@alem.com',
    type: 'Salud',
    slug: 'farmacia-pueblo',
    description: 'Atención 24hs y los mejores descuentos para estudiantes.',
    logoUrl: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?q=80&w=800',
    address: 'Av. Libertador 300, Alem, Misiones',
    isVisible: true,
    isFeatured: false,
    location: {
      lat: -27.6042,
      lng: -55.3205,
      address: 'Av. Libertador 300, Alem, Misiones'
    }
  },
  {
    id: 'demo-supplier-5',
    name: 'Librería El Estudiante',
    email: 'ventas@estudiante.com',
    type: 'Comercio',
    slug: 'libreria-estudiante',
    description: 'Tu lugar para fotocopias, útiles y libros en Leandro N. Alem.',
    logoUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800',
    address: 'Catamarca 85, Alem, Misiones',
    isVisible: true,
    isFeatured: true,
    location: {
      lat: -27.6010,
      lng: -55.3240,
      address: 'Catamarca 85, Alem, Misiones'
    }
  }
];

const DEMO_BENEFITS = [
  {
    id: 'benefit-galpon-1',
    ownerId: 'demo-supplier-1',
    title: 'Parrillada Estudiantil',
    description: '15% de descuento en parrillada completa para 2 personas presentando DNI estudiantil.',
    category: 'Comida',
    imageUrl: 'https://images.unsplash.com/photo-1544333346-645472890451?q=80&w=800',
    points: 120,
    isVisible: true,
    highlight: 'Tradición Misionera'
  },
  {
    id: 'benefit-fitness-1',
    ownerId: 'demo-supplier-2',
    title: 'Pase Libre Mensual',
    description: 'Ahorrá el 20% en tu pase libre mensual de gimnasio y clases grupales.',
    category: 'Salud',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800',
    points: 400,
    isVisible: true,
    minLevel: 2
  },
  {
    id: 'benefit-mision-1',
    ownerId: 'demo-supplier-3',
    title: 'Descuento en Regionales',
    description: '10% de descuento en todos los productos regionales y artesanales.',
    category: 'Comercio',
    imageUrl: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?q=80&w=800',
    points: 150,
    isVisible: true,
    minLevel: 1
  },
  {
    id: 'benefit-estud-1',
    ownerId: 'demo-supplier-5',
    title: 'Kit de Fotocopias',
    description: 'Promo exclusiva: 50 fotocopias + resaltador de regalo.',
    category: 'Educación',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800',
    points: 50,
    isVisible: true,
    isExclusive: true
  }
];

const DEMO_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    supplierId: 'demo-supplier-3',
    title: 'Nuevo Horario Microcentro',
    content: 'Desde el lunes abrimos a las 7:00 am para que empieces el día con el mejor café.',
    status: 'approved',
    isVisible: true,
    authorUsername: 'cafemartinez',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800',
  }
];

export default function SeedPage() {
  const firestore = useFirestore();
  const { user, roles } = useUser();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const seedData = async () => {
    if (!firestore) return;
    setLoading(true);
    setStatus('idle');
    
    try {
      // 1. Seed Suppliers
      for (const supplier of DEMO_SUPPLIERS) {
        await setDoc(doc(firestore, 'roles_supplier', supplier.id), {
          ...supplier,
          createdAt: serverTimestamp()
        });
      }

      // 2. Seed Benefits
      for (const benefit of DEMO_BENEFITS) {
        await setDoc(doc(firestore, 'benefits', benefit.id), {
          ...benefit,
          createdAt: serverTimestamp(),
          active: true,
          status: 'active'
        });
      }

      // 3. Seed Announcements
      for (const ann of DEMO_ANNOUNCEMENTS) {
        await setDoc(doc(firestore, 'announcements', ann.id), {
          ...ann,
          createdAt: serverTimestamp(),
          submittedAt: serverTimestamp(),
          approvedAt: serverTimestamp()
        });
      }

      setStatus('success');
      setMessage('¡Base de datos poblada con éxito con datos de demo premium!');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage('Error al poblar la base de datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetRankings = async () => {
    if (!firestore) return;
    setLoading(true);
    setStatus('idle');
    
    try {
      const { collection, getDocs, writeBatch } = await import('firebase/firestore');
      const usersSnap = await getDocs(collection(firestore, 'users'));
      const batch = writeBatch(firestore);
      
      usersSnap.forEach(userDoc => {
        batch.update(userDoc.ref, {
          points: 0,
          xp: 0,
          level: 1
        });
      });
      
      await batch.commit();
      setStatus('success');
      setMessage(`¡Ranking restablecido! Se han reseteado ${usersSnap.size} usuarios.`);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage('Error al resetear ranking: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="mb-4 p-4 glass bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-[10px] font-mono">
            <p>DEBUG INFO:</p>
            <p>UID: {user?.uid || 'Not signed in'}</p>
            <p>ROLES: {roles.join(', ') || 'None'}</p>
        </div>
        <Card className="glass border-primary/20 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="text-center space-y-2 pb-8">
            <CardTitle className="text-3xl font-black uppercase tracking-tighter">Seed Demo Data</CardTitle>
            <CardDescription className="text-base font-medium">
              Agrega Clubers, Beneficios y Novedades de prueba para ver la nueva interfaz en acción.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-primary/5 rounded-[2rem] p-6 border border-primary/10">
              <h4 className="font-black uppercase tracking-widest text-[10px] text-primary mb-4">Contenido a generar:</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  5 Clubers (Suppliers) con ubicación en Buenos Aires.
                </li>
                <li className="flex items-center gap-3 text-sm font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  10 Beneficios variados con imágenes reales.
                </li>
                <li className="flex items-center gap-3 text-sm font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Novedades/Anuncios para carrusel.
                </li>
              </ul>
            </div>

            {status === 'success' && (
              <div className="flex items-center gap-3 p-4 bg-green-500/10 text-green-500 rounded-2xl border border-green-500/20 animate-in zoom-in-95">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-bold">{message}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 animate-in zoom-in-95">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-bold">{message}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button 
              size="lg" 
              className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={seedData}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sembrando datos...
                </>
              ) : (
                '¡Sembrar Datos Ahora!'
              )}
            </Button>

            <Button 
                variant="outline"
                className="w-full h-12 rounded-2xl text-xs font-black uppercase tracking-widest border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all"
                onClick={resetRankings}
                disabled={loading}
            >
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                )}
                Restablecer Rankings a Cero
            </Button>

            <p className="text-[10px] text-muted-foreground/60 font-medium text-center uppercase tracking-widest">
              Asegúrate de estar logueado para que las reglas de Firestore permitan la escritura.
            </p>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}
