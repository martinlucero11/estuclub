'use client';
import Link from "next/link";
import type { Banner, SupplierProfile, Announcement, SerializableBenefit, SerializableAnnouncement } from "@/types/data";
import Image from "next/image";
import { getInitials, cn } from "@/lib/utils";
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

// --- SUPPLIER CARD ---
const SupplierCard = ({ supplier, priority = false }: { supplier: SupplierProfile, priority?: boolean }) => {
    return (
        <Link 
            href={`/proveedores/${supplier.slug}`} 
            onClick={() => haptic.vibrateSubtle()}
            className="block w-full group text-center active:scale-95 transition-transform duration-200"
        >
            <div className="flex flex-col items-center">
                <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-full aspect-square overflow-hidden rounded-[2rem] bg-card glass glass-dark shadow-premium border border-primary/5 group-hover:border-primary/50 transition-all duration-500 group-hover:shadow-2xl"
                >
                    <Image
                        src={supplier.logoUrl || ''}
                        alt={supplier.name}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 15vw"
                        priority={priority}
                    />
                </motion.div>
                <p className="mt-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-foreground line-clamp-1 group-hover:text-primary transition-colors opacity-70 group-hover:opacity-100">{supplier.name}</p>
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
    const bannerContent = (
      <div className="relative w-full overflow-hidden rounded-2xl h-24 sm:h-32 md:h-36">
          <Image
            src={banner.imageUrl}
            alt={banner.title || "Banner"}
            fill
            className="object-cover"
            priority={priority}
            sizes="100vw"
          />
        </div>
    );

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
                    className="relative w-full overflow-hidden rounded-[2rem] h-24 sm:h-32 md:h-36 shadow-premium group-hover:shadow-2xl transition-all duration-500"
                >
                    <Image
                        src={banner.imageUrl}
                        alt={banner.title || "Banner"}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                        priority={priority}
                        sizes="100vw"
                    />
                </motion.div>
            </Link>
        )

    return bannerContent;
};


// --- CAROUSEL COMPONENTS (ESTRUCTURA FINAL Y ROBUSTA) ---

const carouselArrowClasses = "absolute top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center bg-background/80 hover:bg-background text-foreground rounded-full shadow-xl border border-border transition-all duration-300 hover:scale-110 disabled:opacity-0 w-10 h-10 z-20 backdrop-blur-sm";

export function BenefitsCarousel({ items: benefits }: { items: SerializableBenefit[] }) {
    if (!benefits || benefits.length === 0) return <p className="text-muted-foreground italic text-sm">No hay beneficios para mostrar.</p>;

    return (
       <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent>
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
        <Carousel opts={{ align: "start" }} className="w-full relative">
            <CarouselContent className="-ml-4">
                {suppliers.map((item, index) => (
                    <CarouselItem key={item.id} className="basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 pl-4">
                        <SupplierCard supplier={item as SupplierProfile} />
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
        <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent className="-ml-2">
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
