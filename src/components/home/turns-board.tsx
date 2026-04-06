'use client';

import { useMemo } from 'react';
import { useCollectionOnce, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, limit, collectionGroup } from 'firebase/firestore';
import { SupplierProfile, CluberCategory, Benefit, Service } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    CalendarDays, 
    ChevronRight, 
    ShoppingBag, 
    Briefcase, 
    Building, 
    Users, 
    Heart, 
    Wrench,
    Sparkles,
    CalendarClock
} from 'lucide-react';
import Link from 'next/link';
import { cn, optimizeImage } from '@/lib/utils';
import Image from 'next/image';

const DEFAULT_SERVICE_IMAGE = "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800";

const categoryIcons: Record<string, React.ElementType> = {
    Comercio: ShoppingBag,
    Profesional: Briefcase,
    Empresa: Building,
    Emprendimiento: Users,
    Salud: Heart,
    Estética: Sparkles,
    Servicios: Wrench,
};

export default function TurnsBoard() {
    const firestore = useFirestore();

    const turnsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()),
            where('appointmentsEnabled', '==', true),
            orderBy('name'),
            limit(20)
        );
    }, [firestore]);

    const servicesQuery = useMemo(() => {
        if (!firestore) return null;
        // Query the actual services collection group across all suppliers
        return query(
            collectionGroup(firestore, 'services').withConverter(createConverter<Service>()),
            orderBy('createdAt', 'desc'),
            limit(10)
        );
    }, [firestore]);

    const { data: suppliers, isLoading: loadingSuppliers } = useCollectionOnce(turnsQuery);
    const { data: allServices, isLoading: loadingServices } = useCollectionOnce(servicesQuery);

    const groupedSuppliers = useMemo(() => {
        if (!suppliers) return {};
        const groups: Record<string, SupplierProfile[]> = {};
        suppliers.forEach(s => {
            const type = s.type || 'Otros';
            if (!groups[type]) groups[type] = [];
            groups[type].push(s);
        });
        return groups;
    }, [suppliers]);

    const serviceCards = useMemo(() => {
        if (!allServices || !suppliers) return [];
        const turnSupplierIds = new Set(suppliers.map(s => s.id));
        // Only show services from suppliers who have turns enabled
        return (allServices as Service[]).filter(s => turnSupplierIds.has(s.supplierId));
    }, [allServices, suppliers]);

    if (loadingSuppliers || loadingServices) {
        return (
            <div className="space-y-12 py-4">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="space-y-6">
                        <Skeleton className="h-6 w-40 rounded-full" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[...Array(2)].map((_, j) => (
                                <Skeleton key={j} className="h-32 rounded-[2rem]" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!suppliers || suppliers.length === 0) {
        return (
            <div className="py-20 text-center space-y-4">
                <div className="h-20 w-20 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto border border-primary/10">
                    <CalendarDays className="h-10 w-10 text-primary opacity-20" />
                </div>
                <div className="space-y-1">
                    <p className="text-xl font-black tracking-tighter italic text-black opacity-40 uppercase">No hay profesionales disponibles</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/20">Vuelve más tarde para ver nuevos turnos</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 py-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Service Cards (Turns Services) */}
            {serviceCards.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center gap-3 px-1">
                         <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <CalendarClock className="h-4 w-4 text-primary" />
                        </div>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-black/40 italic">Servicios de Turno</h2>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
                        {serviceCards.map(service => (
                            <Link key={service.id} href={`/proveedores/view?slug=${suppliers.find(s => s.id === service.supplierId)?.slug}`} className="min-w-[280px] shrink-0">
                                <Card className="p-4 rounded-[2rem] border border-black/5 bg-white shadow-xl group relative overflow-hidden h-full">
                                   <div className="aspect-video relative rounded-[1.5rem] overflow-hidden mb-4 border border-black/5">
                                       <Image 
                                            src={optimizeImage(service.imageUrl || DEFAULT_SERVICE_IMAGE, 600)} 
                                            alt={service.name} 
                                            fill 
                                            className="object-cover transition-transform duration-700 group-hover:scale-110" 
                                        />
                                       <div className="absolute top-3 right-3">
                                           <div className="bg-primary px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-lg flex items-center gap-2">
                                                <Sparkles className="h-2.5 w-2.5" /> AGENDAR
                                           </div>
                                       </div>
                                   </div>
                                    <h3 className="font-black text-base tracking-tighter italic text-black leading-tight mb-1">{service.name}</h3>
                                    <p className="text-[10px] font-bold text-black/40 uppercase mb-3">{suppliers.find(s => s.id === service.supplierId)?.name}</p>
                                    <div className="flex items-center justify-between pt-2 border-t border-black/5">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="h-3.5 w-3.5 text-primary" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-black/60">Turnos Libres</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-black/20" />
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Providers Grouped by Category */}
            {Object.entries(groupedSuppliers).map(([category, items]) => {
                const Icon = categoryIcons[category] || Users;
                return (
                    <section key={category} className="space-y-6">
                        <div className="flex items-center gap-3 px-1">
                            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-black/40 italic">
                                {category} <span className="ml-1 opacity-50">({items.length})</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {items.map((cluber) => (
                                <Link key={cluber.id} href={`/proveedores/view?slug=${cluber.slug}`}>
                                    <Card className="p-5 rounded-[2.2rem] border border-black/5 bg-white shadow-xl hover:scale-[1.02] transition-all duration-500 group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                            <Icon className="h-24 w-24 rotate-12" />
                                        </div>
                                        
                                        <div className="flex items-center gap-5 relative z-10">
                                            <Avatar className="h-16 w-16 rounded-2xl border-2 border-black/5 shadow-inner bg-background">
                                                <AvatarImage src={cluber.logoUrl} className="object-cover" />
                                                <AvatarFallback className="bg-primary/5 text-primary font-black uppercase tracking-tighter">
                                                    {cluber.name.substring(0,2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <h3 className="font-black text-lg tracking-tighter italic truncate text-black">{cluber.name}</h3>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-black/40 flex items-center gap-2">
                                                    <CalendarDays className="h-3 w-3 text-primary" />
                                                    VER SERVICIOS
                                                </p>
                                            </div>

                                            <div className="h-12 w-12 rounded-2xl bg-black/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                                <ChevronRight className="h-5 w-5" />
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
