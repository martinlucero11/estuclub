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
        <Link href={`/proveedores/${supplier.slug}`} className="block w-full group">
            <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-card shadow-md border group-hover:border-primary transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <Image
                    src={supplier.logoUrl || ''}
                    alt={supplier.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                 <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                 <p className="absolute bottom-2 left-3 text-sm font-bold text-white line-clamp-2">{supplier.name}</p>
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
      <div className="relative w-full overflow-hidden rounded-2xl aspect-video min-h-[180px]">
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

    if (banner.link) {
        return (
            <Link href={banner.link} target="_blank" rel="noopener noreferrer">
                {bannerContent}
            </Link>
        )
    }

    return bannerContent;
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
            <CarouselContent className="-ml-4">
                {suppliers.map(item => (
                    <CarouselItem key={item.id} className="basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 pl-4">
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
        <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent>
                {banners.map((banner, index) => (
                    <CarouselItem key={banner.id ?? index} className="basis-full md:basis-1/2 pl-4">
                        <BannerCarouselCard 
                            banner={banner as Banner} 
                            priority={index === 0}
                        />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className={cn(carouselArrowClasses, "absolute left-2 top-1/2 -translate-y-1/2")} />
            <CarouselNext className={cn(carouselArrowClasses, "absolute right-2 top-1/2 -translate-y-1/2")} />
        </Carousel>
    );
}