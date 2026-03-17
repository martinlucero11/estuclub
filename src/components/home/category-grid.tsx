'use client';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import type { Category } from '@/types/data';

export function CategoryGrid({ categories }: { categories: Category[] }) {
    if (!categories || categories.length === 0) {
        return <p className="text-muted-foreground italic">No hay categorías disponibles.</p>;
    }

    return (
        <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent className="-ml-4">
                {categories.map(category => (
                    <CarouselItem key={category.id} className="basis-auto pl-4">
                        <Link href={`/benefits?category=${encodeURIComponent(category.name)}`} className="block w-28 text-center group">
                            <div 
                                className={cn(
                                    'flex flex-col items-center justify-center h-28 w-28 mx-auto rounded-2xl transition-all',
                                    'hover:shadow-lg hover:-translate-y-1'
                                )}
                                style={{ backgroundColor: '#ff84c6' }} // Rosa EstuClub con 78% de opacidad
                            >
                                <span className={cn("text-6xl", category.colorClass)}>{category.emoji}</span>
                            </div>
                            <p className="mt-3 text-base font-bold text-foreground group-hover:text-primary flex-wrap">{category.name}</p>
                        </Link>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious variant="ghost" className="absolute left-0 top-[38px] hidden sm:flex" />
            <CarouselNext variant="ghost" className="absolute right-0 top-[38px] hidden sm:flex" />
        </Carousel>
    );
}
