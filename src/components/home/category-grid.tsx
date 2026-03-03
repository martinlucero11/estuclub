'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import type { Category } from '@/types/data';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function CategoryGridSkeleton() {
    return (
        <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-24 text-center space-y-2">
                    <Skeleton className="h-20 w-20 rounded-2xl mx-auto" />
                    <Skeleton className="h-4 w-16 mx-auto" />
                </div>
            ))}
        </div>
    );
}

export function CategoryGrid() {
    const firestore = useFirestore();
    const categoriesQuery = useMemo(() => 
        query(
            collection(firestore, 'categories').withConverter(createConverter<Category>()),
            orderBy('name', 'asc')
        ),
        [firestore]
    );

    const { data: categories, isLoading } = useCollection(categoriesQuery);

    if (isLoading) {
        return <CategoryGridSkeleton />;
    }

    if (!categories || categories.length === 0) {
        return <p className="text-muted-foreground italic px-4">No hay categorías disponibles.</p>;
    }

    return (
        <div className="flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map(category => (
                <Link key={category.id} href={`/benefits?category=${encodeURIComponent(category.name)}`} className="block flex-shrink-0 w-24 snap-start text-center group">
                    <div className={cn(
                        'flex flex-col items-center justify-center h-20 w-20 mx-auto rounded-2xl bg-secondary transition-all',
                        'hover:shadow-lg hover:-translate-y-1'
                    )}>
                         <span className={cn("text-4xl", category.colorClass)}>{category.emoji}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground group-hover:text-primary">{category.name}</p>
                </Link>
            ))}
        </div>
    );
}
