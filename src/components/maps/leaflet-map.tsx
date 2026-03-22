'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
// Important: Only import Leaflet on the client
import type { Map, Icon } from 'leaflet';

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: {
    id: string;
    position: [number, number];
    title: string;
    description?: string;
    onClick?: () => void;
  }[];
  className?: string;
}

export default function LeafletMap({ center, zoom = 14, markers = [], className }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markersRef = useRef<any[]>([]);
  const [L, setL] = useState<any>(null);

  // Load Leaflet only on the client
  useEffect(() => {
    import('leaflet').then((Leaflet) => {
      setL(Leaflet.default);
      // @ts-ignore
      import('leaflet/dist/leaflet.css');
    });
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      scrollWheelZoom: false,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [L]);

  // Update Center
  useEffect(() => {
    if (mapInstanceRef.current && L) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, L]);

  // Update Markers
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const customIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', 
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      className: 'filter-pink drop-shadow-lg'
    });

    markers.forEach(m => {
       const marker = L.marker(m.position, { icon: customIcon }).addTo(mapInstanceRef.current!);
       
       if (m.title) {
         marker.bindPopup(`
            <div style="padding: 4px;">
                <h4 style="margin: 0; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: -0.025em;">${m.title}</h4>
                ${m.description ? `<p style="margin: 4px 0 0; font-size: 10px; opacity: 0.7; font-style: italic;">"${m.description}"</p>` : ''}
            </div>
         `);
       }

       if (m.onClick) {
         marker.on('click', m.onClick);
       }

       markersRef.current.push(marker);
    });

  }, [markers, L]);

  return (
    <div className={cn("relative overflow-hidden rounded-[2rem] border border-primary/10 shadow-premium", className)}>
        {/* Custom Dark Theme Overlay */}
        <style dangerouslySetInnerHTML={{ __html: `
            .leaflet-container {
                background: #0b0e14 !important;
                font-family: inherit;
            }
            .leaflet-tile-pane {
                filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
            }
            .filter-pink {
                filter: hue-rotate(150deg) saturate(2) brightness(1.2);
            }
            .leaflet-popup-content-wrapper {
                background: rgba(0,0,0,0.85) !important;
                backdrop-filter: blur(12px);
                color: white !important;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 1rem !important;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }
            .leaflet-popup-tip {
                background: rgba(0,0,0,0.85) !important;
            }
            .leaflet-control-zoom {
                border: none !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            }
            .leaflet-control-zoom-in, .leaflet-control-zoom-out {
                background: rgba(255,255,255,0.1) !important;
                color: white !important;
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255,255,255,0.1) !important;
            }
        ` }} />
        <div ref={mapContainerRef} className="h-full w-full bg-[#0b0e14]" />
    </div>
  );
}
