'use client';
import Link from "next/link";
import type { Banner, SupplierProfile, Announcement, SerializableBenefit, SerializableAnnouncement } from "@/types/data";
import Image from "next/image";
import { getInitials, cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
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
const SupplierCard = ({ supplier }: { supplier: SupplierProfile }) => {
    const initials = getInitials(supplier.name);
    return (
        <Link href={`/proveedores/${supplier.slug}`} className="block w-24 snap-start text-center group">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-card hover:bg-accent transition-colors flex items-center justify-center">
                 <Avatar className="h-16 w-16">
                    <AvatarImage src={supplier.logoUrl} alt={supplier.name} className="object-cover group-hover:scale-110 transition-transform" />
                    <AvatarFallback className="text-xl font-bold bg-transparent">{initials}</AvatarFallback>
                </Avatar>
            </div>
            <p className="text-sm font-semibold text-center mt-2 line-clamp-1 group-hover:text-primary">{supplier.name}</p>
        </Link>
    );
};

// --- BANNER CAROUSEL CARD ---
const BannerCarouselCard = ({ banner, priority = false, className }: { banner: Banner, priority?: boolean, className?: string }) => {
    const bannerImage = (
        <Image
            src={banner.imageUrl}
            alt={banner.title || 'Banner promocional'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 80vw, 50vw"
            priority={priority}
        />
    );

    const containerClasses = "relative w-full overflow-hidden rounded-2xl";

    if (banner.link) {
        return (
            <Link href={banner.link} target="_blank" rel="noopener noreferrer" className={cn(containerClasses, className)}>
                {bannerImage}
            </Link>
        )
    }

    return (
        <div className={cn(containerClasses, className)}>
            {bannerImage}
        </div>
    );
};


// --- CAROUSEL COMPONENTS (ESTRUCTURA FINAL Y ROBUSTA) ---

const carouselArrowClasses = "hidden sm:flex items-center justify-center bg-white/80 hover:bg-white text-foreground rounded-full shadow-md transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:scale-100 w-10 h-10";

export function BenefitsCarousel({ items: benefits }: { items: SerializableBenefit[] }) {
    if (!benefits || benefits.length === 0) return <p className="text-muted-foreground italic text-sm">No hay beneficios para mostrar.</p>;

    return (
       <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent>
                {benefits.map(item => (
                    <CarouselItem key={item.id} className="basis-[78%] sm:basis-1/2 md:basis-[40%] lg:basis-1/3 pl-4">
                        <BenefitCard benefit={item} variant="carousel" />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className={cn(carouselArrowClasses, "absolute left-2 top-1/2 -translate-y-1/2")}/>
            <CarouselNext className={cn(carouselArrowClasses, "absolute right-2 top-1/2 -translate-y-1/2")} />
        </Carousel>
    )
}

export function SuppliersCarousel({ items: suppliers }: { items: any[] }) {
    if (!suppliers || suppliers.length === 0) return <p className="text-muted-foreground italic text-sm">No hay proveedores para mostrar.</p>;

    return (
        <Carousel opts={{ align: "start" }} className="w-full relative">
            <CarouselContent>
                {suppliers.map(item => (
                    <CarouselItem key={item.id} className="basis-auto pl-4">
                        <SupplierCard supplier={item as SupplierProfile} />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className={cn(carouselArrowClasses, "absolute left-2 top-1/2 -translate-y-1/2")} />
            <CarouselNext className={cn(carouselArrowClasses, "absolute right-2 top-1/2 -translate-y-1/2")} />
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
                            priority={index < 2} // Prioritize the first two images
                        />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className={cn(carouselArrowClasses, "absolute left-2 top-1/2 -translate-y-1/2")} />
            <CarouselNext className={cn(carouselArrowClasses, "absolute right-2 top-1/2 -translate-y-1/2")} />
        </Carousel>
    )
}

export function BannersCarousel({ items: banners }: { items: any[] }) {
    if (!banners || banners.length === 0) {
        return <p className="text-muted-foreground italic text-sm">No hay banners para mostrar.</p>;
    }
    
    return (
        <Carousel opts={{ align: "start", loop: true }} className="w-full mt-4">
            <CarouselContent className="-ml-4">
                {banners.map((banner, index) => (
                    <CarouselItem key={banner.id} className="basis-full sm:basis-1/2 pl-4 h-48">
                        <BannerCarouselCard 
                            banner={banner as Banner} 
                            priority={index === 0}
                            className="h-full"
                        />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className={cn(carouselArrowClasses, "absolute left-2 top-1/2 -translate-y-1/2")} />
            <CarouselNext className={cn(carouselArrowClasses, "absolute right-2 top-1/2 -translate-y-1/2")} />
        </Carousel>
    );
}
