'use client';

import React, { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Order } from '@/types/data';
import { Loader2, Navigation, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { createRoot } from 'react-dom/client';
import dynamic from 'next/dynamic';
import { animate } from 'framer-motion';

// Reuse the 3D Rider Marker
const Rider3DMarker = dynamic(() => import('@/components/rider/rider-3d-marker').then(mod => mod.Rider3DMarker), { 
    ssr: false,
    loading: () => null
});

interface OrderTrackingMapProps {
    orderId: string;
    destination: { lat: number; lng: number };
    onStatusChange?: (status: string) => void;
}

export function OrderTrackingMap({ orderId, destination, onStatusChange }: OrderTrackingMapProps) {
    const firestore = useFirestore();
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [orderStatus, setOrderStatus] = useState<string | null>(null);
    const [zoom, setZoom] = useState(14);
    
    // Smooth Interpolation State
    const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number; heading: number | null } | null>(null);
    const [smoothLocation, setSmoothLocation] = useState<{ lat: number; lng: number } | null>(null);
    
    // Markers and Roots
    const advancedRiderMarkerRef = useRef<any>(null);
    const riderMarkerRootRef = useRef<any>(null);
    const destinationMarkerRef = useRef<google.maps.Marker | null>(null);
    const hasCenteredRef = useRef(false);
    const animationRef = useRef<any>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    const MAP_ID = '325b6c075991d024627ca671';

    // ── FIREBASE SYNC & COST CONTROL ──
    useEffect(() => {
        if (!firestore || !orderId) return;

        const subscribe = () => {
            if (unsubscribeRef.current) unsubscribeRef.current();
            
            unsubscribeRef.current = onSnapshot(doc(firestore, 'orders', orderId), (snapshot) => {
                if (!snapshot.exists()) return;
                const data = snapshot.data();
                
                setOrderStatus(data.status);
                if (onStatusChange) onStatusChange(data.status);

                // Auto-cleanup on final states
                if (['delivered', 'completed', 'cancelled'].includes(data.status)) {
                    stopTracking();
                    return;
                }

                if (data.riderLocation) {
                    const newLoc = {
                        lat: data.riderLocation.latitude,
                        lng: data.riderLocation.longitude,
                        heading: data.heading || null
                    };
                    setRiderLocation(newLoc);
                }
            });
        };

        const stopTracking = () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                subscribe();
            } else {
                stopTracking();
            }
        };

        // Initial Start
        subscribe();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopTracking();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (animationRef.current) animationRef.current.stop();
        };
    }, [firestore, orderId]);

    // ── INTERPOLATION ENGINE (LERP) ──
    useEffect(() => {
        if (!riderLocation) return;
        
        // If it's the first location, set it immediately
        if (!smoothLocation) {
            setSmoothLocation({ lat: riderLocation.lat, lng: riderLocation.lng });
            return;
        }

        if (animationRef.current) animationRef.current.stop();
        
        // Smoothly glide for 8 seconds to bridge the 20s update gap
        animationRef.current = animate(
            { lat: smoothLocation.lat, lng: smoothLocation.lng },
            { lat: riderLocation.lat, lng: riderLocation.lng },
            {
                type: "spring",
                bounce: 0,
                duration: 8,
                onUpdate: (latest) => {
                    setSmoothLocation({ lat: latest.lat, lng: latest.lng });
                    if (advancedRiderMarkerRef.current) {
                        advancedRiderMarkerRef.current.position = { lat: latest.lat, lng: latest.lng };
                    }
                }
            }
        );

        return () => animationRef.current?.stop();
    }, [riderLocation]);

    // ── MAP INITIALIZATION ──
    useEffect(() => {
        if (!mapRef.current || isLoaded) return;

        const initMap = async () => {
            if (window.google && window.google.maps) {
                const map = new google.maps.Map(mapRef.current!, {
                    center: destination,
                    zoom: 15,
                    mapTypeId: 'roadmap',
                    renderingType: google.maps.RenderingType.VECTOR,
                    mapId: MAP_ID,
                    colorScheme: 'dark' as any,
                    disableDefaultUI: true,
                    tilt: 45,
                    gestureHandling: 'greedy'
                });

                setMapInstance(map);
                setIsLoaded(true);

                map.addListener('zoom_changed', () => {
                    setZoom(map.getZoom() || 15);
                });
            } else {
                setTimeout(initMap, 500);
            }
        };

        initMap();
    }, [destination]);

    // ── BOUNDS & CAMERA ──
    useEffect(() => {
        if (!mapInstance || !riderLocation || !destination) return;

        const updateBounds = () => {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(destination);
            bounds.extend(riderLocation);

            // Calculation of distance to adjust zoom behavior
            const dist = google.maps.geometry?.spherical?.computeDistanceBetween(
                new google.maps.LatLng(riderLocation.lat, riderLocation.lng),
                new google.maps.LatLng(destination.lat, destination.lng)
            ) || 1000;

            // Only fit bounds if we haven't locked in yet or if we are still far away
            if (!hasCenteredRef.current || dist > 300) {
                mapInstance.fitBounds(bounds, {
                    top: 100,
                    right: 100,
                    bottom: 100,
                    left: 100
                });
                
                // Initial tilt and orientation
                if (!hasCenteredRef.current) {
                    mapInstance.setTilt(45);
                    hasCenteredRef.current = true;
                }
            } else {
                // Closer than 300m: Focus more on rider + destination relationship
                mapInstance.panTo(riderLocation);
                if (mapInstance.getZoom()! < 18) mapInstance.setZoom(18);
            }
        };

        // Ensure geometry library is loaded for distance calc
        if (window.google.maps.geometry) {
            updateBounds();
        } else {
            google.maps.importLibrary("geometry").then(() => updateBounds());
        }
    }, [mapInstance, riderLocation, destination]);

    // ── RIDER MARKER (3D) ──
    useEffect(() => {
        if (!mapInstance || !smoothLocation) return;
        let isCancelled = false;

        const updateRiderMarker = async () => {
            const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
            if (isCancelled) return;

            if (!advancedRiderMarkerRef.current) {
                const container = document.createElement('div');
                container.style.width = '200px';
                container.style.height = '200px';
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';
                container.style.transform = 'translateY(50%)';

                advancedRiderMarkerRef.current = new AdvancedMarkerElement({
                    position: smoothLocation,
                    map: mapInstance,
                    content: container,
                    title: "Rider está llegando",
                    zIndex: 999,
                    collisionBehavior: google.maps.CollisionBehavior.REQUIRED
                });

                riderMarkerRootRef.current = createRoot(container);
            }

            if (riderMarkerRootRef.current) {
                riderMarkerRootRef.current.render(
                    <Rider3DMarker 
                        lat={smoothLocation.lat}
                        lng={smoothLocation.lng}
                        heading={riderLocation?.heading || 0}
                        zoom={zoom}
                        isDark={true}
                    />
                );
            }
        };

        updateRiderMarker();
        return () => { isCancelled = true; };
    }, [mapInstance, smoothLocation, zoom, riderLocation?.heading]);

    // ── DESTINATION MARKER ──
    useEffect(() => {
        if (!mapInstance || !destination) return;

        if (!destinationMarkerRef.current) {
            destinationMarkerRef.current = new google.maps.Marker({
                position: destination,
                map: mapInstance,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#cb465a",
                    fillOpacity: 1,
                    strokeWeight: 4,
                    strokeColor: "#ffffff",
                },
                title: "Tu Ubicación"
            });
        }
    }, [mapInstance, destination]);

    const handleCenterRoute = () => {
        if (!mapInstance || !riderLocation || !destination) return;
        haptic.vibrateSubtle();
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(destination);
        bounds.extend(riderLocation);
        mapInstance.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 100 });
    };

    const isFinalState = ['delivered', 'completed', 'cancelled'].includes(orderStatus || '');

    return (
        <div className="relative w-full h-full bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 text-[#cb465a] animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#cb465a]/60">Sincronizando Trayecto...</p>
                    </div>
                </div>
            )}

            {isFinalState && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="text-center p-8 space-y-4">
                        <div className="h-20 w-20 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                            <MapPin className="h-8 w-8 text-emerald-400" />
                        </div>
                        <h3 className="text-3xl font-black italic uppercase italic tracking-tighter text-white">Viaje Finalizado</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60">¡Disfruta tu pedido!</p>
                    </div>
                </div>
            )}

            {!riderLocation && isLoaded && !isFinalState && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-fit">
                    <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
                        <Loader2 className="h-4 w-4 text-[#cb465a] animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/80 whitespace-nowrap">Esperando Señal GPS del Rider...</p>
                    </div>
                </div>
            )}

            <div ref={mapRef} className="w-full h-full" />

            {/* CONTROLS */}
            {!isFinalState && isLoaded && (
                <div className="absolute right-6 bottom-6 flex flex-col gap-3 z-30">
                    <Button 
                        onClick={handleCenterRoute}
                        disabled={!riderLocation}
                        className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 hover:bg-black/80 shadow-2xl group transition-all active:scale-95 disabled:opacity-20"
                        size="icon"
                    >
                        <Navigation className="h-5 w-5 text-[#cb465a] group-hover:scale-110 transition-transform" />
                    </Button>
                </div>
            )}

            <style jsx global>{`
                .gm-style-cc, .gmnoprint, a[href^="https://maps.google.com/maps"] {
                    display: none !important;
                }
                button[title="Toggle fullscreen view"], button[title="Keyboard shortcuts"] {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}
