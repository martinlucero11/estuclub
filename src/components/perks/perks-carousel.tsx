
'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import PerkCard from './perk-card';
import AnnouncementCard from '../announcements/announcement-card';
import type { CarouselItemType } from '@/app/page';

export default function PerksCarousel({ carouselItems }: { carouselItems: CarouselItemType[]}) {

  if (!carouselItems || carouselItems.length === 0) {
    return (
         <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center h-48">
            <h3 className="text-xl font-semibold">No hay nada destacado</h3>
            <p className="mt-2 text-sm text-muted-foreground">
            Vuelve más tarde para ver las últimas novedades.
            </p>
      </div>
    );
  }

  return (
    <Carousel 
        opts={{ loop: true, align: 'start' }} 
        className="w-full"
    >
      <CarouselContent className="-ml-2">
        {carouselItems.map((item) => (
          <CarouselItem key={`${item.type}-${item.id}`} className="md:basis-1/2 lg:basis-1/3 pl-2 h-48">
            {item.type === 'perk' ? (
              <PerkCard perk={item} variant="carousel" className="h-full" />
            ) : (
              <AnnouncementCard announcement={item} variant="carousel" className="h-full" />
            )}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 hidden sm:flex" />
      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex" />
    </Carousel>
  );
}
