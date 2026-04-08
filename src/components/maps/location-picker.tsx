'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import type { Map, Marker as LeafletMarker } from 'leaflet';
import { Button } from '../ui/button';
import { MapPin, Navigation, Search, Loader2, X } from 'lucide-react';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';

interface LocationPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  className?: string;
}

// Leandro N. Alem, Misiones, Argentina
const DEFAULT_CENTER: [number, number] = [-27.6022, -55.3242];

export default function LocationPicker({ initialLocation, onLocationSelect, className }: LocationPickerProps) {
  const { toast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const tileLayerRef = useRef<any>(null);
  const labelsLayerRef = useRef<any>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const { theme, resolvedTheme } = useTheme();
  const [L, setL] = useState<any>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(initialLocation || null);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

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

    const centerCoord: [number, number] = initialLocation ? [initialLocation.lat, initialLocation.lng] : DEFAULT_CENTER;
    
    const map = L.map(mapContainerRef.current, {
      center: centerCoord,
      zoom: 16,
      zoomControl: false,
    });

    // Strategy for Hybrid: Esri Satellite + OpenStreetMap Labels
    const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    const labelsUrl = 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png';

    const tiles = L.tileLayer(satelliteUrl, {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19
    }).addTo(map);

    const labels = L.tileLayer(labelsUrl, {
      subdomains: 'abcd',
      maxZoom: 19,
      pane: 'shadowPane' // Higher Z-index than tiles
    }).addTo(map);

    tileLayerRef.current = tiles;
    labelsLayerRef.current = labels;
    
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

  function updateMarker(lat: number, lng: number) {
    if (!L || !mapInstanceRef.current) return;

    setSelectedCoords({ lat, lng });

    if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
    } else {
        const icon = L.divIcon({
          html: `
            <div class="relative group">
              <div class="absolute -inset-4 bg-primary/40 rounded-full blur-xl animate-pulse"></div>
              <div class="relative flex items-center justify-center w-10 h-10 bg-primary rounded-2xl shadow-premium border-2 border-white/20">
                 <svg viewBox="0 0 24 24" fill="none" class="w-6 h-6 text-white stroke-2 stroke-current"><path d="M12 2L2 7L12 12L22 7L12 2Z"/><path d="M2 17L12 22L22 17"/><path d="M2 12L12 17L22 12"/></svg>
              </div>
            </div>
          `,
          className: '',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
        markerRef.current = L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current);
    }
  }

  const centerOnUser = () => {
    if (!navigator.geolocation) {
        toast({ title: "No disponible", description: "Tu navegador no soporta geolocalización." });
        return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            mapInstanceRef.current?.setView([latitude, longitude], 17);
            updateMarker(latitude, longitude);
            onLocationSelect({ lat: latitude, lng: longitude });
            setIsLocating(false);
            toast({ title: "Ubicación encontrada", description: "El mapa se ha centrado en tu posición." });
        },
        (error) => {
            console.error("Geolocation error:", error);
            setIsLocating(false);
            toast({ 
                variant: "destructive", 
                title: "Error de ubicación", 
                description: "No se pudo obtener tu ubicación. Asegúrate de dar permisos." 
            });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
        const data = await response.json();

        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);
            mapInstanceRef.current?.setView([latitude, longitude], 17);
            updateMarker(latitude, longitude);
            onLocationSelect({ lat: latitude, lng: longitude });
            toast({ title: "Lugar encontrado", description: data[0].display_name });
        } else {
            toast({ variant: "destructive", title: "No encontrado", description: "No pudimos encontrar esa dirección." });
        }
    } catch (error) {
        console.error("Search error:", error);
        toast({ variant: "destructive", title: "Error de búsqueda", description: "Hubo un problema al buscar la dirección." });
    } finally {
        setIsSearching(false);
    }
  };

  return (
    <div className={cn("relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-premium group", className)}>
        <style dangerouslySetInnerHTML={{ __html: `
            .leaflet-container { background: #001219 !important; }
            .leaflet-control-attribution { display: none !important; }
        ` }} />
        
        <div ref={mapContainerRef} className="h-[350px] md:h-[450px] w-full" />
        
        {/* Search Bar - More Compact Glassmorphism */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2">
            <div className="flex gap-2 max-w-[400px]">
                <div className="relative flex-1 group/input">
                    <form onSubmit={handleSearch}>
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar dirección..."
                            className="h-10 pl-10 pr-6 rounded-xl bg-white/10 backdrop-blur-3xl border-white/10 text-white text-[11px] font-bold placeholder:text-white/40 focus:bg-black/40 focus:ring-primary/20 transition-all duration-500 shadow-2xl"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50 group-focus-within/input:text-primary transition-colors duration-500" />
                    </form>
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Controls - Grouped on the Left for less intrusion */}
        <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-3 items-start">
            {selectedCoords && (
                <div className="bg-white/10 backdrop-blur-3xl border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-bottom-1 duration-500">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-mono text-white/90 tracking-widest font-black uppercase">
                        {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                    </span>
                </div>
            )}
            
            <Button 
                onClick={centerOnUser}
                disabled={isLocating}
                type="button"
                className="rounded-xl bg-black/40 backdrop-blur-3xl border border-white/10 h-10 px-4 hover:bg-primary/20 text-white font-black uppercase tracking-widest text-[9px] shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
                {isLocating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <Navigation className="h-3.5 w-3.5 text-primary" />
                )}
                Mi ubicación
            </Button>
        </div>
    </div>
  );
}
