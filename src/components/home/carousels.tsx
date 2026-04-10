'use client';
import React, { useMemo } from 'react';
import Link from "next/link";
import { doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import type { Announcement, Banner, SupplierProfile, SerializableBenefit, SerializableAnnouncement, Product, Service } from "@/types/data";
import Image from "next/image";
import { getInitials, cn, optimizeImage } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { haptic } from "@/lib/haptics";
import { motion } from "framer-motion";
import BenefitCard from "../benefits/benefit-card";
import { ProductCard } from "../delivery/product-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import AnnouncementCard from "../announcements/announcement-card";
import { makeAnnouncementSerializable } from "@/lib/data";
import { MapPin, Star, Plus, Clock, Truck, ShoppingCart, Sparkles, CalendarDays, ChevronRight } from "lucide-react";
import { formatDistance, calculateDistance } from "@/lib/geo-utils";
import { useUser } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useCart } from "@/context/cart-context";
import { Button } from "../ui/button";

// --- SUPPLIER CARD ---
const SupplierCard = React.memo(({ supplier, priority = false, activeTab }: { supplier: SupplierProfile, priority?: boolean, activeTab?: string }) => {
    const { userLocation } = useUser();
    
    const distance = useMemo(() => {
        if (userLocation && supplier.location) {
            return calculateDistance(
                userLocation.lat, userLocation.lng,
                supplier.location.lat, supplier.location.lng
            );
        }
        return null;
    }, [userLocation, supplier.location]);

    return (
        <Link 
            href={`/proveedores/view?slug=${supplier.slug}${activeTab ? `&tab=${activeTab}` : ''}`} 
            onClick={() => haptic.vibrateSubtle()}
            className="block w-full group text-center active:scale-95 transition-all duration-500"
        >
            <div className="flex flex-col items-center">
                <motion.div 
                    whileHover={{ scale: 1.05, y: -8 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-full aspect-square overflow-hidden rounded-[2.5rem] glass glass-dark shadow-premium border border-primary/10 group-hover:border-primary/40 transition-all duration-700 group-hover:shadow-[0_20px_50px_rgba(203, 70, 90,0.15)] group-hover:glass-glow-pink flex items-center justify-center bg-card"
                >
                    {supplier.logoUrl ? (
                        <Image
                            src={optimizeImage(supplier.logoUrl, 400)}
                            alt={supplier.name}
                            fill
                            className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 15vw"
                            priority={priority}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-4">
                            <span className="text-primary font-black text-3xl group-hover:scale-110 transition-transform duration-500">
                                {getInitials(supplier.name)}
                            </span>
                        </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {distance !== null && (
                        <div className="absolute top-3 right-3 z-30 animate-in fade-in zoom-in duration-500">
                             <div className="bg-primary/90 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-white/20 flex items-center gap-1.5 shadow-xl scale-100 group-hover:scale-110 transition-all duration-500">
                                <MapPin className="h-3 w-3 text-white fill-current/20" />
                                <span className="text-[10px] font-black tracking-tighter text-white drop-shadow-md">{formatDistance(distance)}</span>
                            </div>
                        </div>
                    )}
                </motion.div>
                <div className="mt-4 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/50 group-hover:text-primary transition-all duration-500 group-hover:tracking-[0.3em] line-clamp-1">{supplier.name}</p>
                    
                    {supplier.avgRating && supplier.avgRating > 0 && (
                        <div className="flex items-center justify-center gap-1.5 mt-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-[10px] font-black tracking-tight">{supplier.avgRating.toFixed(1)}</span>
                        </div>
                    )}

                    <div className="h-0.5 w-0 bg-primary mx-auto group-hover:w-4 transition-all duration-500 rounded-full" />
                </div>
            </div>
        </Link>
    );
});
SupplierCard.displayName = 'SupplierCard';

// --- MINI SUPPLIER CARD (CIRCULAR LOGOS) ---
const MiniSupplierCard = ({ supplier, activeTab }: { supplier: SupplierProfile, activeTab?: string }) => {
    return (
        <Link 
            href={`/proveedores/view?slug=${supplier.slug}${activeTab ? `&tab=${activeTab}` : ''}`} 
            onClick={() => haptic.vibrateSubtle()}
            className="block w-full group text-center active:scale-95 transition-all duration-200"
        >
            <div className="flex flex-col items-center gap-2">
                <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden border border-white/10 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-500 bg-card flex items-center justify-center">
                    {supplier.logoUrl ? (
                        <Image
                            src={optimizeImage(supplier.logoUrl, 200)}
                            alt={supplier.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <span className="text-primary font-black text-xs uppercase tracking-tighter">
                            {getInitials(supplier.name)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
};

// --- ANNOUNCEMENT CAROUSEL CARD ---
interface AnnouncementCarouselCardProps {
  announcement: Announcement
  priority?: boolean
}

const AnnouncementCarouselCard = ({ announcement, priority = false }: AnnouncementCarouselCardProps) => {
    return (
        <Link 
            href={announcement.linkUrl || '#'} 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={() => haptic.vibrateImpact()}
            className="block group"
        >
            <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full overflow-hidden rounded-[2.5rem] aspect-[3/1] shadow-premium group-hover:shadow-2xl transition-all duration-500 border border-white/5 group-hover:border-primary/20"
            >
                {announcement.imageUrl ? (
                    <Image
                        src={optimizeImage(announcement.imageUrl, 1200)}
                        alt={announcement.title || "Announcement"}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                        priority={priority}
                        sizes="100vw"
                    />
                ) : (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center p-8">
                        <div className="text-center">
                            <h4 className="text-primary font-black text-2xl uppercase tracking-tighter italic mb-2">{announcement.title}</h4>
                            <p className="text-primary/40 font-bold text-xs uppercase tracking-[0.2em]">ESTUCLUB ANNOUNCEMENT</p>
                        </div>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
            </motion.div>
        </Link>
    )
};

// --- BANNER CAROUSEL CARD (3:1 STATIC ADS) ---
const BannerCarouselCard = ({ banner, priority = false }: { banner: Banner, priority?: boolean }) => {
    return (
        <Link 
            href={banner.linkUrl || '#'} 
            target={banner.linkUrl?.startsWith('http') ? "_blank" : "_self"}
            rel={banner.linkUrl?.startsWith('http') ? "noopener noreferrer" : ""}
            onClick={() => haptic.vibrateImpact()}
            className="block group"
        >
            <motion.div 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="relative w-full overflow-hidden rounded-[2.5rem] aspect-[3/1] shadow-premium group-hover:shadow-2xl transition-all duration-500 border border-white/5 group-hover:border-primary/20"
            >
                {banner.imageUrl ? (
                    <Image
                        src={optimizeImage(banner.imageUrl, 1600)}
                        alt={banner.title || "Banner Publicitario"}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
                        priority={priority}
                        sizes="100vw"
                    />
                ) : (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center p-6">
                         <div className="text-center opacity-30">
                            <h4 className="text-primary font-black text-3xl uppercase tracking-tighter italic">{banner.title || "PUBLICIDAD"}</h4>
                        </div>
                    </div>
                )}
            </motion.div>
        </Link>
    )
};

// --- SERVICE CAROUSEL CARD (PREMIUM) ---
const ServiceCarouselCard = ({ service, activeTab }: { service: Service, activeTab?: string }) => {
    const firestore = useFirestore();
    const { data: supplier } = useDoc<SupplierProfile>(
        service.supplierId ? doc(firestore, 'roles_supplier', service.supplierId) : null
    );

    return (
        <Link 
            href={`/proveedores/view?slug=${supplier?.slug || ''}${activeTab ? `&tab=${activeTab}` : ''}`}
            onClick={() => haptic.vibrateSubtle()}
            className="group block h-full"
        >
            <div className="flex flex-col h-full bg-white rounded-[2rem] overflow-hidden shadow-premium border border-black/5 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl group relative">
                 <div className="aspect-[1.5/1] relative rounded-[1.5rem] overflow-hidden m-2 border border-black/5">
                    <Image 
                        src={optimizeImage(service.imageUrl || "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800", 600)} 
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

                <div className="p-4 pt-1 flex flex-col flex-1">
                    <h3 className="font-black text-base tracking-tighter italic text-black leading-tight mb-1 group-hover:text-primary transition-colors">{service.name}</h3>
                    <p className="text-[10px] font-bold text-black/40 uppercase mb-3">{supplier?.name || "EstuCluber"}</p>
                    
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-black/5">
                        <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-black/60">{service.duration} mins</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-primary">${service.price || 0}</span>
                            <ChevronRight className="h-4 w-4 text-black/20" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

// --- CAROUSEL COMPONENTS ---

const carouselArrowClasses = "absolute top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center glass glass-dark text-foreground rounded-full shadow-2xl border border-white/10 transition-all duration-300 hover:scale-110 active:scale-90 disabled:opacity-0 w-12 h-12 z-20 backdrop-blur-xl hover:bg-primary/10 hover:border-primary/30";

export function BenefitsCarousel({ items: benefits, activeTab }: { items: SerializableBenefit[], activeTab?: string }) {
    if (!benefits || benefits.length === 0) return <p className="text-foreground italic text-sm">No hay beneficios para mostrar.</p>;

    return (
       <Carousel opts={{ align: "start" }} className="w-full py-10 -my-10">
            <CarouselContent className="py-10 -my-10">
                {benefits.map((item, index) => (
                    <CarouselItem key={item.id} className="basis-[78%] sm:basis-1/2 md:basis-[40%] lg:basis-1/3 pl-4">
                        <BenefitCard benefit={item} variant="carousel" priority={index < 2} activeTab={activeTab} />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className={cn(carouselArrowClasses, "-left-2 lg:-left-6")}/>
            <CarouselNext className={cn(carouselArrowClasses, "-right-2 lg:-right-6")} />
        </Carousel>
    )
}

export function ServicesCarousel({ items: services, activeTab }: { items: Service[], activeTab?: string }) {
    if (!services || services.length === 0) return <p className="text-foreground italic text-sm">No hay servicios disponibles.</p>;

    return (
        <Carousel opts={{ align: "start" }} className="w-full py-10 -my-10">
            <CarouselContent className="py-10 -my-10">
                {services.map((item, index) => (
                    <CarouselItem key={item.id} className="basis-[78%] sm:basis-1/2 md:basis-[40%] lg:basis-1/3 pl-4">
                        <ServiceCarouselCard service={item} activeTab={activeTab} />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className={cn(carouselArrowClasses, "-left-2 lg:-left-6")}/>
            <CarouselNext className={cn(carouselArrowClasses, "-right-2 lg:-right-6")} />
        </Carousel>
    );
}

export function SuppliersCarousel({ items: suppliers, activeTab }: { items: any[], activeTab?: string }) {
    if (!suppliers || suppliers.length === 0) return <p className="text-foreground italic text-sm">No hay proveedores para mostrar.</p>;

    return (
        <Carousel opts={{ align: "start" }} className="w-full relative py-10 -my-10">
            <CarouselContent className="-ml-4 py-10 -my-10">
                {suppliers.map((item, index) => (
                    <CarouselItem key={item.id} className="basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 pl-4">
                        <SupplierCard supplier={item as SupplierProfile} priority={index < 4} activeTab={activeTab} />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className={cn(carouselArrowClasses, "-left-2 lg:-left-6")} />
            <CarouselNext className={cn(carouselArrowClasses, "-right-2 lg:-right-6")} />
        </Carousel>
    )
}

export function MiniSuppliersCarousel({ items: suppliers, activeTab }: { items: any[], activeTab?: string }) {
    if (!suppliers || suppliers.length === 0) return null;

    return (
        <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent className="-ml-2">
                {suppliers.map((item) => (
                    <CarouselItem key={item.id} className="basis-[18%] sm:basis-[12%] md:basis-[10%] lg:basis-[8%] pl-2">
                        <MiniSupplierCard supplier={item as SupplierProfile} activeTab={activeTab} />
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    );
}

export function AnnouncementsCarousel({ items: announcements }: { items: Announcement[] }) {
    if (!announcements || announcements.length === 0) return <p className="text-foreground italic text-sm">No hay anuncios para mostrar.</p>;

    return (
        <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent className="-ml-6">
                {announcements.map((item, index) => (
                    <CarouselItem key={item.id} className="basis-[82%] sm:basis-1/2 md:basis-[40%] lg:basis-1/3 pl-6 h-48">
                        <AnnouncementCard 
                            announcement={makeAnnouncementSerializable(item)} 
                            variant="carousel" 
                            className="absolute inset-0 w-full h-full"
                        />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className={cn(carouselArrowClasses, "-left-2 lg:-left-6")} />
            <CarouselNext className={cn(carouselArrowClasses, "-right-2 lg:-right-6")} />
        </Carousel>
    )
}

export function BannersCarousel({ items: banners }: { items: Banner[] }) {
    if (!banners || banners.length === 0) return null;

    return (
        <Carousel opts={{ align: "start", loop: true }} className="w-full py-8 -my-8">
            <CarouselContent className="-ml-4 py-8 -my-8">
                {banners.map((item, index) => (
                    <CarouselItem key={item.id || index} className="basis-full md:basis-1/2 lg:basis-[48%] pl-4">
                        <BannerCarouselCard 
                            banner={item} 
                            priority={index === 0}
                        />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className={cn(carouselArrowClasses, "left-2 z-10")} />
            <CarouselNext className={cn(carouselArrowClasses, "right-2 z-10")} />
        </Carousel>
    )
}

export function HighlightAnnouncementsCarousel({ items: announcements }: { items: Announcement[] }) {
    if (!announcements || announcements.length === 0) {
        return <p className="text-foreground italic text-sm">No hay anuncios destacados para mostrar.</p>;
    }
    
    return (
        <Carousel opts={{ align: "start", loop: true }} className="w-full py-8 -my-8">
            <CarouselContent className="-ml-2 py-8 -my-8">
                {announcements.map((item, index) => (
                    <CarouselItem key={item.id || index} className="basis-full md:basis-1/2 pl-2">
                        <AnnouncementCarouselCard 
                            announcement={item} 
                            priority={index === 0}
                        />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className={cn(carouselArrowClasses, "left-2 z-10")} />
            <CarouselNext className={cn(carouselArrowClasses, "right-2 z-10")} />
        </Carousel>
    );
}

// --- SUPPLIER PROMO CARD (BENEFIT STYLE) ---
export function SupplierPromoCard({ supplier, activeTab }: { supplier: SupplierProfile, activeTab?: string }) {
    return (
        <Link 
            href={`/proveedores/view?slug=${supplier.slug}${activeTab ? `&tab=${activeTab}` : ''}`}
            onClick={() => haptic.vibrateSubtle()}
            className="group relative flex w-full flex-col justify-end overflow-hidden rounded-[2.5rem] text-white transition-all duration-700 shadow-premium border border-white/5 aspect-[2.2/1] h-40 sm:h-48 hover:shadow-2xl active:scale-[0.98] hover:border-primary/30 hover:shadow-primary/10"
        >
            {supplier.coverUrl || supplier.logoUrl ? (
                <Image
                    src={optimizeImage(supplier.coverUrl || supplier.logoUrl || '', 800)}
                    alt={supplier.name}
                    fill
                    className="object-cover transition-transform duration-1000 ease-in-out group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, 33vw"
                />
            ) : (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <span className="text-white/20 font-black text-6xl uppercase tracking-tighter">
                        {supplier.name}
                    </span>
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-500 group-hover:from-primary/40 group-hover:via-black/40" />
            
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-30 font-bold group">
                <div className="bg-primary text-white border border-white/30 py-1 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest leading-none w-fit shadow-lg">
                    {supplier.type}
                </div>
            </div>

            <div className="relative z-10 flex h-full flex-col justify-end p-4 text-left">
                <div className='space-y-1'>
                    <h3 className="font-black uppercase tracking-tighter leading-[0.9] mb-0.5 text-lg md:text-xl group-hover:text-primary transition-all duration-500 group-hover:scale-[1.02] origin-left drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                        {supplier.name}
                    </h3>
                </div>
                
                <div className="pt-3 flex items-center justify-between border-t border-white/20 mt-3 transition-colors duration-500 group-hover:border-primary/40">
                    <div className="flex items-center gap-2 text-xs text-white font-black uppercase tracking-[0.15em] drop-shadow-md">
                        <MapPin className="h-3.5 w-3.5 opacity-90" />
                        <span className="truncate max-w-[150px]">{supplier.address || 'Cerca de ti'}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export function SupplierPromoCarousel({ items: suppliers, activeTab }: { items: any[], activeTab?: string }) {
    if (!suppliers || suppliers.length === 0) return null;

    return (
        <Carousel opts={{ align: "start" }} className="w-full py-10 -my-10">
            <CarouselContent className="py-10 -my-10">
                {suppliers.map((item) => (
                    <CarouselItem key={item.id} className="basis-[78%] sm:basis-1/2 md:basis-[40%] lg:basis-1/3 pl-4">
                        <SupplierPromoCard supplier={item as SupplierProfile} activeTab={activeTab} />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className={cn(carouselArrowClasses, "-left-2 lg:-left-6")}/>
            <CarouselNext className={cn(carouselArrowClasses, "-right-2 lg:-right-6")} />
        </Carousel>
    );
}
export function ProductsCarousel({ items: products }: { items: any[] }) {
    if (!products || products.length === 0) return <p className="text-foreground italic text-sm">No hay productos destacados.</p>;

    return (
        <Carousel opts={{ align: "start" }} className="w-full py-10 -my-10">
            <CarouselContent className="py-10 -my-10">
                {products.map((item, index) => (
                    <CarouselItem key={item.id} className="basis-[65%] sm:basis-1/3 md:basis-1/4 pl-4">
                        <ProductCard product={item} variant="carousel" />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className={cn(carouselArrowClasses, "-left-2 lg:-left-6")}/>
            <CarouselNext className={cn(carouselArrowClasses, "-right-2 lg:-right-6")} />
        </Carousel>
    );
}

// --- PRODUCT WITH SUPPLIER CARD (PREMIUM DESIGN) ---
const ProductWithSupplierCard = React.memo(({ product, supplier: initialSupplier, activeTab }: { product: Product, supplier?: SupplierProfile, activeTab?: string }) => {
    const firestore = useFirestore();
    const { data: fetchedSupplier } = useDoc<SupplierProfile>(
        (!initialSupplier && product.supplierId) ? doc(firestore, 'roles_supplier', product.supplierId) : null
    );
    const supplier = initialSupplier || fetchedSupplier;
    const { addItem } = useCart();

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        haptic.vibrateSubtle();
        if (supplier) {
            addItem({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                imageUrl: product.imageUrl
            }, {
                id: supplier.id,
                name: supplier.name,
                phone: supplier.whatsappContact || ''
            });
        }
    };
    
    return (
        <Link 
            href={`/proveedores/view?slug=${supplier?.slug || ''}&tab=${activeTab || 'catalog'}`}
            onClick={() => haptic.vibrateSubtle()}
            className="group block h-full"
        >
            <div className="flex flex-col h-full bg-card rounded-[1.75rem] overflow-hidden shadow-premium border border-primary/5 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:glass-glow-pink">
                {/* Image Section */}
                <div className="relative aspect-[4/3] w-full overflow-hidden group-hover:scale-[1.02] transition-transform duration-700 bg-card flex items-center justify-center">
                    {product.imageUrl ? (
                        <Image 
                            src={optimizeImage(product.imageUrl, 600)} 
                            alt={product.name}
                            fill
                            className="object-cover transition-all duration-1000 group-hover:scale-110"
                        />
                    ) : (
                         <div className="flex flex-col items-center justify-center p-4">
                            <span className="text-primary/20 font-black text-4xl italic tracking-tighter">ESTUCLUB</span>
                        </div>
                    )}
                    <div className="absolute top-3 left-3 z-10">
                        <span className="bg-emerald-400/90 text-emerald-950 text-[9px] font-black px-2 py-1 rounded-lg flex shadow-lg backdrop-blur-md border border-white/20 uppercase tracking-wider w-max">
                            Mismo precio que en local
                        </span>
                    </div>

                    {/* Add to Cart Floating Button */}
                    <Button 
                        size="icon" 
                        variant="default"
                        className="absolute bottom-3 right-3 h-10 w-10 rounded-xl shadow-2xl transition-all duration-300 hover:scale-110 active:scale-90 z-20 group/btn bg-primary text-white"
                        onClick={handleAddToCart}
                    >
                        <Plus className="h-5 w-5 group-hover/btn:rotate-90 transition-transform duration-300" />
                    </Button>
                </div>

                {/* Content Section */}
                <div className="p-3.5 flex-1 flex flex-col justify-between bg-gradient-to-b from-card to-background/30">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 border border-primary/20 shadow-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                            <AvatarImage src={supplier?.logoUrl} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {getInitials(supplier?.name || 'S')}
                            </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                                <h4 className="font-black text-base tracking-tight truncate group-hover:text-primary transition-colors">
                                    {supplier?.name || 'EstuCluber'}
                                </h4>
                                {supplier?.avgRating && (
                                    <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 px-1.5 py-0.5 rounded-md">
                                        <Star className="h-2 w-2 fill-current" />
                                        <span className="text-[9px] font-black">{supplier.avgRating.toFixed(1)}</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2 mt-0.5 text-foreground">
                                <div className="flex items-center gap-1 text-[10px] font-bold">
                                    <Clock className="h-2.5 w-2.5 text-primary/60" />
                                    <span>30-50 min</span>
                                </div>
                                <span className="text-foreground/20 text-[10px]">•</span>
                                <div className="flex items-center gap-1 text-[10px] font-bold whitespace-nowrap">
                                    <Truck className="h-2.5 w-2.5 text-primary/60" />
                                    <span>$ {supplier?.deliveryCost || 'Envío'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-primary/5">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold opacity-60 line-clamp-1">{product.name}</p>
                            <p className="font-black text-primary text-sm">$ {product.price.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
});
ProductWithSupplierCard.displayName = 'ProductWithSupplierCard';

export function ProductsWithSupplierCarousel({ items: products, activeTab }: { items: any[], activeTab?: string }) {
    if (!products || products.length === 0) return (
        <div className="text-center py-10 opacity-50 italic">No hay productos destacados.</div>
    );

    return (
        <Carousel opts={{ align: "start" }} className="w-full py-8 -my-8">
            <CarouselContent className="py-8 -my-8">
                {products.map((item, index) => (
                    <CarouselItem key={item.id} className="basis-[75%] sm:basis-[45%] md:basis-[35%] pl-4">
                        <ProductWithSupplierCard product={item} activeTab={activeTab} />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className={cn(carouselArrowClasses, "-left-2 lg:-left-6")}/>
            <CarouselNext className={cn(carouselArrowClasses, "-right-2 lg:-right-6")} />
        </Carousel>
    );
}
