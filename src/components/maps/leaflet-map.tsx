'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';

// Important: Only import Leaflet on the client
import type { Map, Icon } from 'leaflet';

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: {
    id: string;
    slug?: string;
    position: [number, number];
    title: string;
    description?: string;
    onClick?: () => void;
  }[];
  className?: string;
}

export default function LeafletMap({ center, zoom = 14, markers = [], className }: MapProps) {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const { theme, resolvedTheme } = useTheme();
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

    const isDark = resolvedTheme === 'dark';
    const tileUrl = isDark 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const tiles = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    tileLayerRef.current = tiles;
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

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

    const createCustomIcon = (title: string) => {
      return L.divIcon({
        html: `
          <div class="relative group">
            <div class="absolute -inset-4 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
            <div class="relative flex items-center justify-center w-10 h-10 bg-primary rounded-2xl shadow-xl border-2 border-white/20 transform hover:scale-110 hover:-translate-y-2 transition-all duration-300">
               <svg viewBox="0 0 24 24" fill="none" class="w-6 h-6 text-white stroke-2 stroke-current">
                 <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                 <path d="M2 17L12 22L22 17" />
                 <path d="M2 12L12 17L22 12" />
               </svg>
               <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45 border-r-2 border-b-2 border-white/10 shadow-lg"></div>
            </div>
            <div class="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
               <span class="text-[9px] font-black text-white uppercase tracking-widest">${title}</span>
            </div>
          </div>
        `,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 45],
        popupAnchor: [0, -45],
      });
    };

    markers.forEach(m => {
       const marker = L.marker(m.position, { icon: createCustomIcon(m.title) }).addTo(mapInstanceRef.current!);
       
       if (m.title) {
         marker.bindPopup(`
            <div class="premium-popup-card">
                <div class="popup-header">
                    <div class="status-badge">Estuclub Cluber</div>
                    <h3 class="popup-title">${m.title}</h3>
                    ${m.description ? `<p class="popup-description">${m.description}</p>` : ''}
                </div>
                <div class="popup-footer">
                    <button class="popup-action-btn" id="popup-btn-${m.id}">
                        Ver Perfil
                        <svg viewBox="0 0 24 24" class="w-3 h-3 ml-1" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                </div>
            </div>
         `, {
            className: 'estuclub-custom-popup',
            maxWidth: 250
         });
       }

       if (m.onClick) {
         marker.on('click', m.onClick);
       }

        marker.on('popupopen', () => {
             const btn = document.getElementById(`popup-btn-${m.id}`);
             if (btn) {
                 btn.onclick = () => {
                     if (m.slug) {
                         router.push(`/proveedores/${m.slug}`);
                     } else {
                         router.push(`/proveedores`);
                     }
                 };
             }
        });

       markersRef.current.push(marker);
    });

  }, [markers, L]);

  return (
    <div className={cn("relative overflow-hidden rounded-[2rem] border border-primary/10 shadow-premium", className)}>
        {/* Custom Dark Theme Overlay */}
        <style dangerouslySetInnerHTML={{ __html: `
            .leaflet-container {
                background: ${resolvedTheme === 'dark' ? '#0b0e14' : '#f8f9fa'} !important;
                font-family: inherit;
            }
            .estuclub-custom-popup .leaflet-popup-content-wrapper {
                background: ${resolvedTheme === 'dark' ? 'rgba(15, 18, 25, 0.85)' : 'rgba(255, 255, 255, 0.85)'} !important;
                backdrop-filter: blur(20px) saturate(180%);
                color: ${resolvedTheme === 'dark' ? 'white' : 'black'} !important;
                border: 1px solid ${resolvedTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
                border-radius: 1.5rem !important;
                padding: 0 !important;
                overflow: hidden;
                box-shadow: 0 20px 50px rgba(0,0,0,0.3);
            }
            .estuclub-custom-popup .leaflet-popup-content {
                margin: 0 !important;
                width: 220px !important;
            }
            .estuclub-custom-popup .leaflet-popup-tip {
                background: ${resolvedTheme === 'dark' ? 'rgba(15, 18, 25, 0.85)' : 'rgba(255, 255, 255, 0.85)'} !important;
                backdrop-filter: blur(20px);
            }
            .premium-popup-card {
                padding: 1.25rem;
            }
            .status-badge {
                display: inline-block;
                padding: 0.25rem 0.5rem;
                background: hsl(var(--primary) / 0.1);
                color: hsl(var(--primary));
                font-size: 8px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                border-radius: 0.5rem;
                margin-bottom: 0.75rem;
            }
            .popup-title {
                margin: 0;
                font-weight: 900;
                font-size: 14px;
                letter-spacing: -0.025em;
                text-transform: uppercase;
                font-style: italic;
            }
            .popup-description {
                margin: 0.5rem 0 0;
                font-size: 10px;
                opacity: 0.6;
                line-height: 1.4;
            }
            .popup-footer {
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid ${resolvedTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
            }
            .popup-action-btn {
                width: 100%;
                background: hsl(var(--primary));
                color: white;
                border: none;
                border-radius: 0.75rem;
                padding: 0.6rem;
                font-size: 10px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                display: flex;
                items-center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
            }
            .popup-action-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px hsl(var(--primary) / 0.4);
            }
            .leaflet-control-attribution {
                display: none !important;
            }
            .leaflet-control-zoom {
                border: none !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            }
            .leaflet-control-zoom-in, .leaflet-control-zoom-out {
                background: ${resolvedTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'white'} !important;
                color: ${resolvedTheme === 'dark' ? 'white' : 'black'} !important;
                backdrop-filter: blur(8px);
                border: 1px solid ${resolvedTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
            }
        ` }} />
        <div ref={mapContainerRef} className="h-full w-full bg-[#0b0e14]" />
        
        {/* Branded Logo Overlay */}
        <div className="absolute bottom-4 left-6 z-[1000] pointer-events-none select-none flex flex-col items-start gap-1">
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <img src="/logo.svg" alt="Estuclub" className="h-4 w-auto brightness-200 contrast-125" />
                <div className="w-[1px] h-3 bg-white/20 mx-1"></div>
                <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Map Explorer</span>
            </div>
        </div>
    </div>
  );
}
