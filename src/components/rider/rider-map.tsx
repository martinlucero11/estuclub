'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Order } from '@/types/data';
import { Loader2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { createRoot } from 'react-dom/client';
import dynamic from 'next/dynamic';
import { animate, motion, AnimatePresence } from 'framer-motion';

const Rider3DMarker = dynamic(() => import('./rider-3d-marker').then(mod => mod.Rider3DMarker), { 
    ssr: false,
    loading: () => null
});

interface RiderMapProps {
    orders: Order[];
    onOrderSelect: (order: Order) => void;
    userLocation?: { lat: number; lng: number; heading: number | null };
    isOnline?: boolean;
    activeTripOrder?: Order | null;
}

export function RiderMap({ orders, onOrderSelect, userLocation, isOnline, activeTripOrder }: RiderMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [zoom, setZoom] = useState(14);
    
    // Directions Service & Renderer
    const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
    const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
    const [navigationInfo, setNavigationInfo] = useState<{
        distance: string;
        duration: string;
        instruction: string;
    } | null>(null);

    const markersRef = useRef<google.maps.Marker[]>([]);
    const advancedUserMarkerRef = useRef<any>(null);
    const userMarkerRootRef = useRef<any>(null);
    const radarCirclesRef = useRef<google.maps.Circle[]>([]);
    const pulseCircleRef = useRef<google.maps.Circle | null>(null);
    const pulseIntervalRef = useRef<any>(null);
    const hasCenteredRef = useRef(false);
    const defaultCenter = { lat: -27.4877, lng: -55.3218 };
    
    // Performance: Smooth Location Interpolation
    // No state here to avoid 60fps re-renders of the whole component
    const animationRef = useRef<any>(null);

    // Sync Smooth Location with Throttled Input
    useEffect(() => {
        if (!userLocation || isNaN(userLocation.lat) || isNaN(userLocation.lng)) return;
        
        if (animationRef.current) animationRef.current.stop();
        
        // Use a simple object to track previous interpolated values
        const lastPos = advancedUserMarkerRef.current?.position || defaultCenter;

        animationRef.current = animate(
            { lat: lastPos.lat, lng: lastPos.lng },
            { lat: userLocation.lat, lng: userLocation.lng },
            {
                type: "spring",
                bounce: 0,
                duration: 2.5,
                onUpdate: (latest) => {
                    // DEFENSIVE: Block invalid updates to prevented Google Maps library crash
                    if (isNaN(latest.lat) || isNaN(latest.lng)) return;
                    
                    if (advancedUserMarkerRef.current) {
                        try {
                            advancedUserMarkerRef.current.position = { lat: latest.lat, lng: latest.lng };
                        } catch (err) {
                            console.warn('[RiderMap] Failed to update marker position:', err);
                        }
                    }
                    if (pulseCircleRef.current) {
                        pulseCircleRef.current.setCenter({ lat: latest.lat, lng: latest.lng });
                    }
                    if (radarCirclesRef.current.length > 0) {
                        radarCirclesRef.current.forEach(c => {
                            try { c.setCenter({ lat: latest.lat, lng: latest.lng }); } catch (e) {}
                        });
                    }
                }
            }
        );

        return () => animationRef.current?.stop();
    }, [userLocation]);



    useEffect(() => {
        if (!mapRef.current || isLoaded) return;

        const checkGoogle = () => {
            if (window.google && window.google.maps) {
                const map = new google.maps.Map(mapRef.current!, {
                    center: userLocation || defaultCenter,
                    zoom: 14,
                    minZoom: 12,
                    mapTypeId: 'roadmap',
                    renderingType: google.maps.RenderingType.VECTOR,
                    mapId: '325b6c075991d024627ca671',
                    colorScheme: 'dark' as any,
                    disableDefaultUI: true,
                    zoomControl: false,
                    gestureHandling: 'greedy',
                    tilt: 45,
                    heading: userLocation?.heading || 0,
                    mapTypeControl: false,
                    streetViewControl: false,
                    rotateControl: false,
                    fullscreenControl: false,
                    backgroundColor: '#0a0a0a'
                });

                // Add padding to prevent bottom nav clipping
                // Defensive check to avoid "setPadding is not a function"
                if (typeof (map as any).setPadding === 'function') {
                    (map as any).setPadding({ top: 0, right: 0, bottom: 200, left: 0 });
                } else {
                    map.setOptions({ padding: { top: 0, right: 0, bottom: 200, left: 0 } } as any);
                }

                setMapInstance(map);
                
                // Initialize Directions
                directionsServiceRef.current = new google.maps.DirectionsService();
                directionsRendererRef.current = new google.maps.DirectionsRenderer({
                    map: map,
                    suppressMarkers: true,
                    polylineOptions: {
                        strokeColor: '#cb465a',
                        strokeWeight: 6,
                        strokeOpacity: 0.8
                    }
                });

                setIsLoaded(true);

                map.addListener('zoom_changed', () => {
                    setZoom(map.getZoom() || 14);
                });
            } else {
                setTimeout(checkGoogle, 500);
            }
        };

        checkGoogle();
    }, [userLocation]);

    // Update User Location Marker (3D)
    useEffect(() => {
        if (!mapInstance || !userLocation) return;
        let isCancelled = false;

        // "First Lock" - Auto-pan to user when location is first resolved
        if (!hasCenteredRef.current) {
            mapInstance.panTo(userLocation);
            mapInstance.setZoom(19); 
            mapInstance.setTilt(45);
            if (userLocation.heading !== null) mapInstance.setHeading(userLocation.heading);
            hasCenteredRef.current = true;
        } else if (userLocation.heading !== null) {
            // Smooth heading update for Vector maps
            mapInstance.setHeading(userLocation.heading);
        }

        const updateMarker = async () => {
            const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
            if (isCancelled) return;

            if (!advancedUserMarkerRef.current) {
                const container = document.createElement('div');
                container.style.width = '200px'; // Significantly larger container
                container.style.height = '200px';
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';
                // Center the marker precisely over the point
                container.style.transform = 'translateY(50%)';                 
                advancedUserMarkerRef.current = new AdvancedMarkerElement({
                    position: userLocation,
                    map: mapInstance,
                    content: container,
                    title: "Tu ubicación",
                    zIndex: 999,
                    // Use collisionBehavior to avoid being hidden by other markers
                    collisionBehavior: google.maps.CollisionBehavior.REQUIRED
                });

                userMarkerRootRef.current = createRoot(container);
            } else {
                advancedUserMarkerRef.current.position = userLocation;
                // Re-initialize root if it was somehow lost (e.g. hot reload)
                if (!userMarkerRootRef.current && advancedUserMarkerRef.current.content) {
                    userMarkerRootRef.current = createRoot(advancedUserMarkerRef.current.content as HTMLElement);
                }
            }

            if (userMarkerRootRef.current) {
                userMarkerRootRef.current.render(
                    <Rider3DMarker 
                        heading={userLocation.heading}
                        zoom={zoom}
                        isDark={true}
                    />
                );
            }
        };

        updateMarker();

        // Create pulse circle if it doesn't exist and isOnline
        if (isOnline && !pulseCircleRef.current) {
            pulseCircleRef.current = new google.maps.Circle({
                strokeColor: '#cb465a',
                strokeOpacity: 0.8,
                strokeWeight: 1,
                fillColor: '#cb465a',
                fillOpacity: 0.2,
                map: mapInstance,
                center: userLocation,
                radius: 10,
                clickable: false
            });

            let radius = 10;
            pulseIntervalRef.current = setInterval(() => {
                radius += 2;
                if (radius > 100) radius = 10;
                pulseCircleRef.current?.setRadius(radius);
                pulseCircleRef.current?.setOptions({ 
                    strokeOpacity: Math.max(0, 0.8 - (radius / 125)),
                    fillOpacity: Math.max(0, 0.2 - (radius / 500))
                });
            }, 50);
        } else if (!isOnline && pulseCircleRef.current) {
            // Stop and clear pulse if offline
            if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
            pulseCircleRef.current.setMap(null);
            pulseCircleRef.current = null;
        } else if (isOnline && pulseCircleRef.current) {
            pulseCircleRef.current.setCenter(userLocation);
        }

        // Create decorative radar circles (fixed ranges)
        if (isOnline && radarCirclesRef.current.length === 0) {
            const ranges = [500, 1000, 2000];
            ranges.forEach(range => {
                const circle = new google.maps.Circle({
                    strokeColor: '#cb465a',
                    strokeOpacity: 0.1,
                    strokeWeight: 1,
                    fillOpacity: 0,
                    map: mapInstance,
                    center: userLocation,
                    radius: range,
                    clickable: false
                });
                radarCirclesRef.current.push(circle);
            });
        } else if (!isOnline && radarCirclesRef.current.length > 0) {
            radarCirclesRef.current.forEach(c => c.setMap(null));
            radarCirclesRef.current = [];
        } else if (isOnline && radarCirclesRef.current.length > 0) {
            radarCirclesRef.current.forEach(c => c.setCenter(userLocation));
        }

        return () => {
            isCancelled = true;
            if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
        };
    }, [mapInstance, userLocation, isOnline]);

    const handleCenterUser = () => {
        if (!mapInstance || !userLocation) return;
        haptic.vibrateSubtle();
        mapInstance.panTo(userLocation);
        mapInstance.setZoom(16);
    };

    // Update Order Markers
    useEffect(() => {
        if (!mapInstance) return;

        // Clear old markers
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        orders.forEach(order => {
            const lat = order.supplierCoords?.latitude;
            const lng = order.supplierCoords?.longitude;

            if (lat && lng) {
                const marker = new google.maps.Marker({
                    position: { lat, lng },
                    map: mapInstance,
                    icon: {
                        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                        fillColor: "#cb465a",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#ffffff",
                        scale: 1.5,
                        anchor: new google.maps.Point(12, 24),
                        labelOrigin: new google.maps.Point(12, -10)
                    },
                    label: {
                        text: `$${order.deliveryCost || order.deliveryFee}`,
                        color: "#fff",
                        fontSize: "10px",
                        fontWeight: "900",
                        className: "bg-black/80 px-2 py-1 rounded-full border border-[#cb465a]/30"
                    }
                });

                marker.addListener("click", () => {
                    onOrderSelect(order);
                });

                markersRef.current.push(marker);
            }
        });
    }, [mapInstance, orders]);

    // Calculate Trip Directions
    useEffect(() => {
        if (!mapInstance || !activeTripOrder || !userLocation || !directionsServiceRef.current || !directionsRendererRef.current) {
            if (directionsRendererRef.current) directionsRendererRef.current.setDirections({ routes: [] } as any);
            setNavigationInfo(null);
            return;
        }

        const isGoingToStore = ['assigned', 'searching_rider'].includes(activeTripOrder.status);
        const dest = isGoingToStore 
            ? activeTripOrder.supplierCoords 
            : activeTripOrder.deliveryCoords;

        if (!dest || !dest.latitude || !dest.longitude) return;

        const request = {
            origin: { lat: userLocation.lat, lng: userLocation.lng },
            destination: { lat: dest.latitude, lng: dest.longitude },
            travelMode: google.maps.TravelMode.DRIVING
        };

        directionsServiceRef.current.route(request, (result, status) => {
            if (status === 'OK' && result) {
                directionsRendererRef.current?.setDirections(result);
                
                const leg = result.routes[0].legs[0];
                setNavigationInfo({
                    distance: leg.distance?.text || '',
                    duration: leg.duration?.text || '',
                    instruction: leg.steps[0]?.instructions.replace(/<[^>]*>?/gm, '') || ''
                });
            }
        });
    }, [mapInstance, activeTripOrder?.status, userLocation?.lat, userLocation?.lng]);

    // Format Google Maps External Link
    const openInGoogleMaps = () => {
        if (!activeTripOrder || !userLocation) return;
        const isGoingToStore = ['assigned', 'searching_rider'].includes(activeTripOrder.status);
        const dest = isGoingToStore ? activeTripOrder.supplierCoords : activeTripOrder.deliveryCoords;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${dest.latitude},${dest.longitude}&travelmode=driving`;
        window.open(url, '_blank');
    };

    return (
        <div className="relative w-full h-full">
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 text-[#cb465a] animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#cb465a]/60">INICIALIZANDO RADAR...</p>
                    </div>
                </div>
            )}
            <div ref={mapRef} className="w-full h-full" />

            {/* NAVIGATION INSTRUCTIONS OVERLAY */}
            <AnimatePresence>
                {navigationInfo && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-24 left-6 right-6 z-20 pointer-events-none"
                    >
                        <div className="bg-black/80 backdrop-blur-2xl border border-[#cb465a]/30 rounded-[2rem] p-5 shadow-2xl flex items-center justify-between pointer-events-auto">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-[#cb465a]/20 flex items-center justify-center">
                                    <Navigation className="h-6 w-6 text-[#cb465a]" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#cb465a]">Siguiente paso</p>
                                    <p className="text-sm font-bold text-white line-clamp-1">{navigationInfo.instruction}</p>
                                    <div className="flex gap-3 mt-1">
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{navigationInfo.distance}</span>
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{navigationInfo.duration}</span>
                                    </div>
                                </div>
                            </div>
                            <Button 
                                size="sm"
                                onClick={openInGoogleMaps}
                                className="h-10 px-4 rounded-xl bg-[#cb465a] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#cb465a]/90 transition-all shadow-lg shadow-[#cb465a]/20"
                            >
                                GPS
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .gm-style-cc, .gmnoprint, a[href^="https://maps.google.com/maps"] {
                    display: none !important;
                }
                button[title="Toggle fullscreen view"], button[title="Keyboard shortcuts"] {
                    display: none !important;
                }
            `}</style>

            {/* FLOATING CONTROLS */}
            <div className="absolute left-6 bottom-[160px] flex flex-col gap-3">
                <Button 
                    onClick={handleCenterUser}
                    className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-xl border border-zinc-200 hover:bg-zinc-50 shadow-lg group transition-all active:scale-95"
                    size="icon"
                >
                    <Navigation className="h-5 w-5 text-zinc-600 group-hover:scale-110 transition-transform" />
                </Button>
            </div>

            {/* SCANNING OVERLAY DECORATION */}
            <div className="absolute inset-0 pointer-events-none border-[20px] border-black/5 rounded-[3rem] z-10" />
        </div>
    );
}

