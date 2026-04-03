'use client';

import React from 'react';
import { SupplierProfile } from '@/types/data';
import { MapPin, Navigation, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface StoreMapProps {
    suppliers: SupplierProfile[];
}

export function StoreMap({ suppliers }: StoreMapProps) {
    // This is a placeholder for a real map (Google Maps/Mapbox/Leaflet)
    // We'll use the premium stylized "demand/store map" concept from the Rider app
    
    return (
        <div className="w-full h-[300px] md:h-[400px] bg-background rounded-[2.5rem] border border-primary/10 shadow-premium relative overflow-hidden mb-10 group">
            {/* Animated Mesh Grid Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/5 opacity-50 z-0" />

            {/* Interactive Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
                <div className="bg-background/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-2xl space-y-3 max-w-xs animate-in zoom-in duration-700">
                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
                        <MapPin className="h-6 w-6 text-primary animate-bounce" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white italic">Explorar Cercanía</h3>
                    <p className="text-[10px] font-bold text-foreground uppercase leading-relaxed tracking-wider">
                        Visualizando {suppliers.length} locales con delivery activo cerca de tu ubicación.
                    </p>
                    <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black tracking-widest">MAPA INTERACTIVO</Badge>
                </div>
            </div>

            {/* Simulated Store Points */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                {suppliers.slice(0, 8).map((s, i) => (
                    <motion.div
                        key={s.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 0.6, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        style={{ 
                            top: `${20 + (i * 15) % 60}%`, 
                            left: `${15 + (i * 22) % 75}%` 
                        }}
                        className="absolute flex flex-col items-center gap-1 group/pin"
                    >
                        <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center backdrop-blur-md shadow-lg shadow-primary/20 cursor-pointer hover:bg-primary transition-all">
                            <Store className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-tighter opacity-0 group-hover/pin:opacity-100 transition-opacity">
                            {s.name}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-6 right-6 z-20 flex gap-2">
                <button className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md hover:bg-white/10 transition-all">
                    <Navigation className="h-4 w-4 text-white" />
                </button>
            </div>
        </div>
    );
}

