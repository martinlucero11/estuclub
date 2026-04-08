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

import { getCategoryEmoji } from '@/lib/category-utils';

export function CategoryGrid({ categories }: { categories: Category[] }) {
    if (!categories || categories.length === 0) {
        return <p className="text-foreground italic">No hay categorías disponibles.</p>;
    }

    return (
        <Carousel 
            opts={{ 
                align: "start",
                dragFree: true
            }} 
            className="w-full"
        >
            <CarouselContent className="-ml-4 py-3">
                {categories.map(category => (
                    <CarouselItem key={category.id} className="basis-auto pl-4">
                        <Link 
                            href={`/${category.type === 'delivery' ? 'delivery' : 'benefits'}?category=${encodeURIComponent(category.name)}`} 
                            className="block w-28 sm:w-32 text-center group"
                        >
                            <div 
                                className={cn(
                                    'flex flex-col items-center justify-center h-28 w-28 sm:h-32 sm:w-32 mx-auto rounded-[2.5rem] transition-all duration-700',
                                    'bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/20 shadow-premium glass transition-all duration-700',
                                    'group-hover:scale-105 group-hover:shadow-2xl group-hover:border-primary/40 group-hover:from-primary/40 group-hover:to-primary/20',
                                    'active:scale-95'
                                )}
                            >
                                <span className="text-6xl sm:text-7xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 drop-shadow-xl">
                                    {category.emoji || getCategoryEmoji(category.name)}
                                </span>
                            </div>
                            <p className="mt-3 text-[11px] sm:text-[13px] font-black uppercase tracking-wider text-foreground group-hover:text-primary transition-colors text-center px-1 leading-tight line-clamp-2">
                                {category.name}
                            </p>
                        </Link>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious variant="ghost" className="absolute -left-12 top-1/2 -translate-y-1/2 hidden lg:flex glass glass-dark border-0 shadow-lg" />
            <CarouselNext variant="ghost" className="absolute -right-12 top-1/2 -translate-y-1/2 hidden lg:flex glass glass-dark border-0 shadow-lg" />
        </Carousel>
    );
}

