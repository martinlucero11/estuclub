'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, Navigation, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    google: any;
  }
}

interface MapLocationPickerProps {
    onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
    initialLocation?: { lat: number; lng: number };
    className?: string;
}

// Leandro N. Alem, Misiones, Argentina
const DEFAULT_CENTER = { lat: -27.6022, lng: -55.3242 }; 

export function MapLocationPicker({ onLocationSelect, initialLocation, className }: MapLocationPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);
    const [address, setAddress] = useState<string>('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const checkGoogle = setInterval(() => {
            if (window.google && window.google.maps && mapRef.current) {
                const mapInstance = new window.google.maps.Map(mapRef.current, {
                    center: initialLocation || DEFAULT_CENTER,
                    zoom: 17,
                    mapTypeId: 'hybrid', // Hybrid: Satellite + Street Labels
                    tilt: 45, // 3D Perspective
                    heading: 0,
                    disableDefaultUI: false, // Re-enable UI for hybrid controls if needed, or keep false for minimal look
                    fullscreenControl: false,
                    streetViewControl: false,
                    mapTypeControl: false,
                    zoomControl: true,
                    gestureHandling: 'greedy', // Better for mobile interaction
                });

                setMap(mapInstance);
                setIsLoaded(true);
                clearInterval(checkGoogle);

                // Idle listener to capture center
                mapInstance.addListener('idle', () => {
                    const center = mapInstance.getCenter();
                    if (center) {
                        reverseGeocode(center.lat(), center.lng());
                    }
                });
            }
        }, 500);

        return () => clearInterval(checkGoogle);
    }, []);

    const reverseGeocode = async (lat: number, lng: number) => {
        if (!window.google) return;
        setIsGeocoding(true);
        const geocoder = new window.google.maps.Geocoder();
        
        try {
            const response = await geocoder.geocode({ location: { lat, lng } });
            if (response.results[0]) {
                const fullAddress = response.results[0].formatted_address;
                setAddress(fullAddress);
                onLocationSelect({ lat, lng, address: fullAddress });
            }
        } catch (error: any) {
            console.warn("Geocoding failed:", error?.message || error);
            if (error?.message?.includes('REQUEST_DENIED')) {
                setAddress('Error: API no autorizada (Revisar consola Google Cloud)');
            } else {
                setAddress('Ubicación sin dirección detectada');
            }
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleCurrentLocation = () => {
        if (navigator.geolocation && map) {
            navigator.geolocation.getCurrentPosition((position) => {
                const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                map.panTo(pos);
                map.setZoom(18);
            });
        }
    };

    return (
        <div className={cn("relative w-full h-[350px] md:h-[450px] rounded-3xl overflow-hidden border border-white/10 shadow-premium group", className)}>
            <div ref={mapRef} className="w-full h-full bg-slate-900" />
            
            {/* Center Pin overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="relative -mt-10 flex flex-col items-center">
                    {/* Shadow pulse */}
                    <div className="absolute bottom-0 w-2 h-2 bg-black/60 blur-md rounded-full scale-150 animate-pulse" />
                    <div className="relative transform hover:scale-110 transition-transform duration-300">
                        <MapPin className="h-12 w-12 text-[#cb465a] filter drop-shadow-[0_0_15px_rgba(203,70,90,0.8)] fill-current" />
                        <div className="absolute top-3 left-3 w-6 h-6 bg-white/20 rounded-full blur-sm" />
                    </div>
                </div>
            </div>

            {/* Address Overlay - Smaller & More Transparent Glass */}
            <div className="absolute top-4 left-4 z-20 max-w-[calc(100%-2rem)]">
                <div className="bg-white/10 backdrop-blur-3xl p-3 rounded-[1.2rem] border border-white/20 shadow-2xl flex items-center gap-3">
                    <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border border-white/10",
                        isGeocoding ? "bg-primary/20 animate-pulse" : "bg-white/5"
                    )}>
                        {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-0.5">Pintar ubicación</p>
                        <p className="text-[10px] font-bold truncate text-white leading-tight">{address || (isLoaded ? 'Ajustando vista...' : 'Cargando...')}</p>
                    </div>
                </div>
            </div>

            {/* Controls - Moved to left for less intrusion */}
            <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-3">
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleCurrentLocation}
                    className="h-10 w-10 rounded-xl bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl hover:bg-primary/20 transition-all hover:scale-110 active:scale-95 group"
                >
                    <Navigation className="h-4 w-4 text-white group-hover:text-primary transition-colors" />
                </Button>
            </div>

            {!isLoaded && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center flex-col gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#cb465a]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 italic animate-pulse">Iniciando Vista Híbrida 3D...</span>
                </div>
            )}
        </div>
    );
}
