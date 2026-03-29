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

export default function LocationPicker({ initialLocation, onLocationSelect, className }: LocationPickerProps) {
  const { toast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const tileLayerRef = useRef<any>(null);
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

    const defaultCenter: [number, number] = initialLocation ? [initialLocation.lat, initialLocation.lng] : [-34.6037, -58.3816];
    
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: false,
    });

    const isDark = resolvedTheme === 'dark';
    const tileUrl = isDark 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const tiles = L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    tileLayerRef.current = tiles;
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

  // Update Theme Tiles
  useEffect(() => {
    if (mapInstanceRef.current && L && tileLayerRef.current) {
        const isDark = resolvedTheme === 'dark';
        const tileUrl = isDark 
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
        
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
    <div className={cn("relative rounded-[2rem] overflow-hidden border border-white/10 shadow-premium group", className)}>
        <style dangerouslySetInnerHTML={{ __html: `
            .leaflet-container { background: ${resolvedTheme === 'dark' ? '#0b0e14' : '#f8f9fa'} !important; }
            .leaflet-control-attribution { display: none !important; }
            .glass-search { background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        ` }} />
        
        <div ref={mapContainerRef} className="h-64 md:h-80 w-full" />
        
        {/* Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2">
            <div className="flex gap-2">
                <div className="relative flex-1 group/input">
                    <form onSubmit={handleSearch}>
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Busca una calle, ciudad o lugar..."
                            className="h-11 pl-11 pr-4 rounded-2xl bg-black/40 backdrop-blur-3xl border-white/10 text-white placeholder:text-white/40 focus:bg-black/60 focus:ring-primary/20 transition-all duration-300 shadow-2xl"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 group-focus-within/input:text-primary transition-colors duration-300" />
                    </form>
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                
                <Button 
                    onClick={() => handleSearch()}
                    disabled={isSearching || !searchQuery.trim()}
                    className="h-11 w-11 p-0 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
            </div>
        </div>

        {/* Locate Me Button (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-[1000]">
            <Button 
                onClick={centerOnUser}
                disabled={isLocating}
                type="button"
                className="rounded-2xl bg-black/40 backdrop-blur-3xl border border-white/10 h-12 px-4 hover:bg-primary/20 text-white font-bold tracking-tight shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
                {isLocating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                    <Navigation className="h-4 w-4 mr-2 text-primary" />
                )}
                Mi ubicación
            </Button>
        </div>

        {selectedCoords && (
            <div className="absolute bottom-4 left-4 z-[1000] animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-black/40 backdrop-blur-3xl border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-2xl">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-mono text-white/70">
                        {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                    </span>
                </div>
            </div>
        )}
    </div>
  );
}
