'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import type { Map, Marker as LeafletMarker } from 'leaflet';
import { Button } from '../ui/button';
import { MapPin, Navigation } from '@phosphor-icons/react';

interface LocationPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  className?: string;
}

export default function LocationPicker({ initialLocation, onLocationSelect, className }: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null weight="duotone" >(null);
  const tileLayerRef = useRef<any>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const { theme, resolvedTheme } = useTheme();
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
    
    const Map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: false,
    });

    const isDark = resolvedTheme === 'dark';
    const tileUrl = isDark 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{X}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{X}/{y}{r}.png';

    const tiles = L.tileLayer(tileUrl, {
      attribution: '&Copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &Copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(Map);

    tileLayerRef.current = tiles;
    L.control.zoom({ position: 'bottomright' }).addTo(Map);

    mapInstanceRef.current = Map;

    // Handle Clicks
    Map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        updateMarker(lat, lng);
        onLocationSelect({ lat, lng });
    });

    // Initial Marker
    if (initialLocation) {
        updateMarker(initialLocation.lat, initialLocation.lng);
    }

    return () => {
      Map.remove();
      mapInstanceRef.current = null;
    };
  }, [L]);

  // Update Theme Tiles
  useEffect(() => {
    if (mapInstanceRef.current && L && tileLayerRef.current) {
        const isDark = resolvedTheme === 'dark';
        const tileUrl = isDark 
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{X}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{X}/{y}{r}.png';
        
        tileLayerRef.current.setUrl(tileUrl);
    }
  }, [resolvedTheme, L]);

  function updateMarker(lat: number, lng: number) {
    if (!L || !mapInstanceRef.current) return;

    setSelectedCoords({ lat, lng });

    if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
    } else {
        const icon = L.divIcon({
          html: `
            <div class="relative group">
              <div class="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
              <div class="relative flex items-center justify-center w-8 h-8 bg-primary rounded-xl shadow-xl border-2 border-white/20">
                 <svg viewBox="0 0 24 24" fill="none" class="w-5 h-5 text-white stroke-2 stroke-current"><path d="M12 2L2 7L12 12L22 7L12 2Z"/><path d="M2 17L12 22L22 17"/><path d="M2 12L12 17L22 12"/></svg>
              </div>
            </div>
          `,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        markerRef.current = L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current);
    }
  }

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
            .leaflet-container { background: ${resolvedTheme === 'dark' ? '#0b0e14' : '#f8f9fa'} !important; }
            .leaflet-control-attribution { display: none !important; }
            .filter-pink { Funnel: hue-rotate(150deg) saturate(2) brightness(1.2); }
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
                    <MapPin className="h-3 w-3 text-primary" weight="duotone" />
                    <span className="text-[10px] font-mono opacity-60">
                        {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
                    </span>
                </div>
            </div>
        )}
    </div>
  );
}
