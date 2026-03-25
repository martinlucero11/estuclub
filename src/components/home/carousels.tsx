'use client';
import Link from "next/link";
import type { Banner, SupplierProfile, Announcement, SerializableBenefit, SerializableAnnouncement } from "@/types/data";
import Image from "next/image";
import { getInitials, cn, optimizeImage } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { haptic } from "@/lib/haptics";
import { motion } from "framer-motion";
import BenefitCard from "../perks/perk-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import AnnouncementCard from "../announcements/announcement-card";
import { makeAnnouncementSerializable } from "@/lib/data";
import { MapPin, Star } from "lucide-react";
import { formatDistance, calculateDistance } from "@/lib/geo-utils";
import { useUser } from "@/firebase";
import { useMemo } from "react";

// --- SUPPLIER CARD ---
const SupplierCard = ({ supplier, priority = false }: { supplier: SupplierProfile, priority?: boolean }) => {
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
            href={`/proveedores/view?slug=${supplier.slug}`} 
            onClick={() => haptic.vibrateSubtle()}
            className="block w-full group text-center active:scale-95 transition-all duration-500"
        >
            <div className="flex flex-col items-center">
                <motion.div 
                    whileHover={{ scale: 1.05, y: -8 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-full aspect-square overflow-hidden rounded-[2.5rem] bg-card glass glass-dark shadow-premium border border-primary/10 group-hover:border-primary/40 transition-all duration-700 group-hover:shadow-[0_20px_50px_rgba(236,72,153,0.15)] group-hover:glass-glow-pink"
                >
                    <Image
                        src={optimizeImage(supplier.logoUrl || '', 400)}
                        alt={supplier.name}
                        fill
                        className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 15vw"
                        priority={priority}
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {distance !== null && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 animate-in fade-in zoom-in duration-500">
                             <div className="bg-primary px-4 py-2 rounded-full border border-white/20 flex items-center gap-2 shadow-lg scale-100 group-hover:scale-110 transition-all duration-500">
                                <MapPin className="h-4 w-4 text-white fill-current/20" />
                                <span className="text-xs font-black tracking-tight text-white drop-shadow-md">{formatDistance(distance)}</span>
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
};

// --- BANNER CAROUSEL CARD ---
interface BannerCarouselCardProps {
  banner: Banner
  priority?: boolean
}

const BannerCarouselCard = ({ banner, priority = false }: BannerCarouselCardProps) => {
    return (
        <Link 
            href={banner.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={() => haptic.vibrateImpact()}
            className="block group"
        >
            <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full overflow-hidden rounded-[2.5rem] h-28 sm:h-32 md:h-40 shadow-premium group-hover:shadow-2xl transition-all duration-500 border border-white/5 group-hover:border-primary/20"
            >
                <Image
                    src={optimizeImage(banner.imageUrl, 1200)}
                    alt={banner.title || "Banner"}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    priority={priority}
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
            </motion.div>
        </Link>
    )
};


// --- CAROUSEL COMPONENTS (ESTRUCTURA FINAL Y ROBUSTA) ---

const carouselArrowClasses = "absolute top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center glass glass-dark text-foreground rounded-full shadow-2xl border border-white/10 transition-all duration-300 hover:scale-110 active:scale-90 disabled:opacity-0 w-12 h-12 z-20 backdrop-blur-xl hover:bg-primary/10 hover:border-primary/30";

export function BenefitsCarousel({ items: benefits }: { items: SerializableBenefit[] }) {
    if (!benefits || benefits.length === 0) return <p className="text-muted-foreground italic text-sm">No hay beneficios para mostrar.</p>;

    return (
       <Carousel opts={{ align: "start" }} className="w-full py-10 -my-10">
            <CarouselContent className="py-10 -my-10">
                {benefits.map((item, index) => (
                    <CarouselItem key={item.id} className="basis-[78%] sm:basis-1/2 md:basis-[40%] lg:basis-1/3 pl-4">
                        <BenefitCard benefit={item} variant="carousel" priority={index < 2} />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className={cn(carouselArrowClasses, "-left-2 lg:-left-6")}/>
            <CarouselNext className={cn(carouselArrowClasses, "-right-2 lg:-right-6")} />
        </Carousel>
    )
}

export function SuppliersCarousel({ items: suppliers }: { items: any[] }) {
    if (!suppliers || suppliers.length === 0) return <p className="text-muted-foreground italic text-sm">No hay proveedores para mostrar.</p>;

    return (
        <Carousel opts={{ align: "start" }} className="w-full relative py-10 -my-10">
            <CarouselContent className="-ml-4 py-10 -my-10">
                {suppliers.map((item, index) => (
                    <CarouselItem key={item.id} className="basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 pl-4">
                        <SupplierCard supplier={item as SupplierProfile} priority={index < 4} />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className={cn(carouselArrowClasses, "-left-2 lg:-left-6")} />
            <CarouselNext className={cn(carouselArrowClasses, "-right-2 lg:-right-6")} />
        </Carousel>
    )
}

export function AnnouncementsCarousel({ items: announcements }: { items: Announcement[] }) {
    if (!announcements || announcements.length === 0) return <p className="text-muted-foreground italic text-sm">No hay anuncios para mostrar.</p>;

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

export function BannersCarousel({ items: banners }: { items: any[] }) {
    if (!banners || banners.length === 0) {
        return <p className="text-muted-foreground italic text-sm">No hay banners para mostrar.</p>;
    }
    
    return (
        <Carousel opts={{ align: "start", loop: true }} className="w-full py-8 -my-8">
            <CarouselContent className="-ml-2 py-8 -my-8">
                {banners.map((banner, index) => (
                    <CarouselItem key={banner.id ?? index} className="basis-full md:basis-1/2 pl-2">
                        <BannerCarouselCard 
                            banner={banner as Banner} 
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
