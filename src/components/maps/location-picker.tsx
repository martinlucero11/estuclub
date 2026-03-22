'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Map, Marker as LeafletMarker } from 'leaflet';
import { Button } from '../ui/button';
import { MapPin, Navigation } from 'lucide-react';

interface LocationPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  className?: string;
}

export default function LocationPicker({ initialLocation, onLocationSelect, className }: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const [L, setL] = useState<any>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(initialLocation || null);

  // Load Leaflet
  useEffect(() => {
    import('leaflet').then((Leaflet) => {
      setL(Leaflet.default);
      // @ts-ignore
      import('leaflet/dist/leaflet.css');
    });
  }, []);

  // Init Map
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    const defaultCenter: [number, number] = initialLocation ? [initialLocation.lat, initialLocation.lng] : [-34.6037, -58.3816];
    
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // Handle Clicks
    map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        updateMarker(lat, lng);
        onLocationSelect({ lat, lng });
    });

    // Initial Marker
    if (initialLocation) {
        updateMarker(initialLocation.lat, initialLocation.lng);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [L]);

  const updateMarker = (lat: number, lng: number) => {
    if (!L || !mapInstanceRef.current) return;

    setSelectedCoords({ lat, lng });

    if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
    } else {
        const icon = L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          className: 'filter-pink drop-shadow-lg'
        });
        markerRef.current = L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current);
    }
  };

  const centerOnUser = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            mapInstanceRef.current?.setView([latitude, longitude], 15);
            updateMarker(latitude, longitude);
            onLocationSelect({ lat: latitude, lng: longitude });
        });
    }
  };

  return (
    <div className={cn("relative rounded-[2rem] overflow-hidden border border-white/10 shadow-premium", className)}>
        <style dangerouslySetInnerHTML={{ __html: `
            .leaflet-container { background: #0b0e14 !important; }
            .leaflet-tile-pane { filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7); }
            .filter-pink { filter: hue-rotate(150deg) saturate(2) brightness(1.2); }
        ` }} />
        
        <div ref={mapContainerRef} className="h-64 md:h-80 w-full" />
        
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
            <div className="glass glass-dark px-4 py-2 rounded-2xl border-white/10 pointer-events-auto">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">
                   {selectedCoords ? 'Ubicación seleccionada' : 'Haz clic para ubicar local'}
                </p>
            </div>
            
            <Button 
                onClick={centerOnUser}
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-xl glass glass-dark border-white/10 pointer-events-auto h-10 px-3 hover:bg-primary/20"
            >
                <Navigation className="h-4 w-4 mr-2 text-primary" />
                Mi ubicación
            </Button>
        </div>

        {selectedCoords && (
            <div className="absolute bottom-4 left-4 z-[1000] animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="glass glass-dark px-3 py-1.5 rounded-lg border-white/10 flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-mono opacity-60">
                        {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
                    </span>
                </div>
            </div>
        )}
    </div>
  );
}
