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

const DEFAULT_CENTER = { lat: -31.3995, lng: -55.2345 }; // Alem, Misiones (Approx)

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
                    zoom: 16,
                    disableDefaultUI: true,
                    styles: [
                        {
                            "featureType": "all",
                            "elementType": "labels.text.fill",
                            "stylers": [{ "color": "#7c93a3" }, { "lightness": "-10" }]
                        },
                        {
                            "featureType": "all",
                            "elementType": "labels.text.stroke",
                            "stylers": [{ "visibility": "on" }, { "color": "#050505" }, { "lightness": 16 }]
                        },
                        {
                            "featureType": "all",
                            "elementType": "labels.icon",
                            "stylers": [{ "visibility": "off" }]
                        },
                        {
                            "featureType": "administrative",
                            "elementType": "geometry.fill",
                            "stylers": [{ "color": "#000000" }, { "lightness": 20 }]
                        },
                        {
                            "featureType": "administrative",
                            "elementType": "geometry.stroke",
                            "stylers": [{ "color": "#000000" }, { "lightness": 17 }, { "weight": 1.2 }]
                        },
                        {
                            "featureType": "landscape",
                            "elementType": "geometry",
                            "stylers": [{ "color": "#111111" }]
                        },
                        {
                            "featureType": "poi",
                            "elementType": "geometry",
                            "stylers": [{ "color": "#000000" }, { "lightness": 21 }]
                        },
                        {
                            "featureType": "road.highway",
                            "elementType": "geometry.fill",
                            "stylers": [{ "color": "#1c1c1c" }]
                        },
                        {
                            "featureType": "road.highway",
                            "elementType": "geometry.stroke",
                            "stylers": [{ "color": "#121212" }, { "weight": 0.2 }]
                        },
                        {
                            "featureType": "road.arterial",
                            "elementType": "geometry",
                            "stylers": [{ "color": "#000000" }, { "lightness": 18 }]
                        },
                        {
                            "featureType": "road.local",
                            "elementType": "geometry",
                            "stylers": [{ "color": "#000000" }, { "lightness": 16 }]
                        },
                        {
                            "featureType": "transit",
                            "elementType": "geometry",
                            "stylers": [{ "color": "#000000" }, { "lightness": 19 }]
                        },
                        {
                            "featureType": "water",
                            "elementType": "geometry",
                            "stylers": [{ "color": "#000000" }, { "lightness": 17 }]
                        }
                    ]
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
        } catch (error) {
            console.error("Geocoding failed", error);
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleCurrentLocation = () => {
        if (navigator.geolocation && map) {
            navigator.geolocation.getCurrentPosition((position) => {
                const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                map.panTo(pos);
                map.setZoom(17);
            });
        }
    };

    return (
        <div className={cn("relative w-full h-[300px] rounded-[2rem] overflow-hidden border border-white/10 shadow-premium group", className)}>
            <div ref={mapRef} className="w-full h-full bg-slate-900" />
            
            {/* Center Pin overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-transform group-active:scale-95">
                <div className="relative -mt-8 flex flex-col items-center">
                    <div className="absolute bottom-0 w-1 h-1 bg-black/40 blur-sm rounded-full scale-150" />
                    <MapPin className="h-10 w-10 text-[#d93b64] filter drop-shadow-[0_0_10px_rgba(217,59,100,0.5)] fill-current" />
                </div>
            </div>

            {/* Address Overlay */}
            <div className="absolute top-4 inset-x-4 z-20">
                <div className="bg-background/80 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3">
                    <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                        isGeocoding ? "bg-primary/10" : "bg-slate-100 dark:bg-white/5"
                    )}>
                        {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">Ubicación del Pin</p>
                        <p className="text-[10px] font-bold truncate text-foreground">{address || (isLoaded ? 'Ajustando ubicación...' : 'Cargando mapa...')}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleCurrentLocation}
                    className="h-10 w-10 rounded-xl glass glass-dark border-white/5 shadow-xl hover:bg-white/10"
                >
                    <Navigation className="h-4 w-4 text-foreground" />
                </Button>
            </div>

            {!isLoaded && (
                <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-[#d93b64]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white italic">Inicializando Mapa...</span>
                </div>
            )}
        </div>
    );
}
