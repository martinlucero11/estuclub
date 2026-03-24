'use client';

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useCollectionOnce, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { SupplierProfile } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import { CircleNotch, Navigation, MapPin } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';

// Dynamic import to avoid SSR issues with Leaflet
const LeafletMap = dynamic(() => import('./leaflet-map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-black/20 animate-pulse rounded-[2rem] flex items-center justify-center"><CircleNotch className="h-10 w-10 text-primary animate-spin" /></div>
});

export default function DiscoveryMap() {
  const [userLocation, setUserLocation] = useState<[number, number]>([-34.6037, -58.3816]); // Default Buenos Aires
  const [isLocating, setIsLocating] = useState(false);
  const firestore = useFirestore();

  // Fetch only suppliers that HAVE a location defined
  const { data: suppliers, isLoading } = useCollectionOnce<SupplierProfile>(
    collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>())
  );

  const markers = useMemo(() => {
    if (!suppliers) return [];
    return suppliers
      .filter(s => s.location && s.location.lat && s.location.lng)
      .map(s => ({
        id: s.id,
        slug: s.slug,
        position: [s.location.lat, s.location.lng] as [number, number],
        title: s.name,
        description: s.type,
      }));
  }, [suppliers]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    haptic.vibrateSubtle();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setIsLocating(false);
        haptic.vibrateSuccess();
      },
      () => {
        setIsLocating(false);
      }
    );
  };

  useEffect(() => {
    // Attempt initial geolocation
    if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition((pos) => {
            setUserLocation([pos.coords.latitude, pos.coords.longitude]);
       });
    }
  }, []);

  return (
    <div className="relative w-full h-[500px] mb-8 group">
       <div className="absolute top-4 right-4 z-10 space-y-2">
            <Button 
                onClick={handleLocateMe} 
                variant="secondary" 
                size="icon"
                className="rounded-full glass glass-dark shadow-premium border-white/20 active:scale-90 transition-all"
                disabled={isLocating}
            >
                {isLocating ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            </Button>
       </div>

       <div className="absolute top-4 left-4 z-10">
          <div className="glass glass-dark px-4 py-2 rounded-2xl border-white/10 flex items-center gap-2 shadow-2xl">
             <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Exploración Activa</span>
          </div>
       </div>
      
       <LeafletMap 
        center={userLocation} 
        zoom={14} 
        markers={markers} 
        className="h-full w-full"
       />

       {!isLoading && markers.length === 0 && (
           <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="glass glass-dark p-6 rounded-[2rem] border-white/5 shadow-premium text-center">
                 <MapPin className="h-10 w-10 text-primary/40 mx-auto mb-3" />
                 <p className="text-xs font-bold uppercase tracking-widest opacity-60">No hay sedes cercanas con GPS habilitado</p>
              </div>
           </div>
       )}
    </div>
  );
}
