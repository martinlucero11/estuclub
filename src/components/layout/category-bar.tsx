import React, { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Category } from '@/types/data';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/haptics';
import { useFirestore, useCollectionOnce } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';

export function CategoryBar() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const firestore = useFirestore();
    
    const isDelivery = pathname.startsWith('/delivery') || pathname.startsWith('/proveedores');
    const type = isDelivery ? 'delivery' : 'perks';
    const currentCategory = searchParams.get('category');

    // Fetch categories dynamically
    const categoriesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'categories').withConverter(createConverter<Category>()),
            where('type', '==', type)
        );
    }, [firestore, type]);
    
    const { data: dbCategories, isLoading } = useCollectionOnce(categoriesQuery);
    
    const categories = useMemo(() => {
        if (!dbCategories) return [];
        return dbCategories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(c => c.name);
    }, [dbCategories]);

    const handleCategoryClick = (category: string | null) => {
        haptic.vibrateSubtle();
        const params = new URLSearchParams(searchParams.toString());
        if (category) {
            params.set('category', category);
        } else {
            params.delete('category');
        }
        
        let targetPath = pathname;
        if (pathname === '/') targetPath = isDelivery ? '/delivery' : '/benefits';

        const queryString = params.toString();
        router.push(`${targetPath}${queryString ? `?${queryString}` : ''}`);
    };

    const showBar = pathname === '/benefits' || pathname === '/delivery' || pathname === '/search' || (pathname === '/' && !pathname.startsWith('/panel'));
    if (!showBar || categories.length === 0) return null;

    return (
        <div className="w-full bg-black/5 dark:bg-white/5 py-3 overflow-hidden border-t border-white/10">
            <div className="container px-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar snap-x snap-mandatory">
                    <button
                        onClick={() => handleCategoryClick(null)}
                        className={cn(
                            "whitespace-nowrap px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 border-2 snap-start",
                            !currentCategory 
                                ? "bg-white text-primary border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105" 
                                : "bg-white/10 border-white/5 text-white/70 hover:bg-white/20 hover:text-white"
                        )}
                    >
                        Todos
                    </button>
                    {categories.map((cat) => {
                        const isActive = currentCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => handleCategoryClick(cat)}
                                className={cn(
                                    "whitespace-nowrap px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 border-2 snap-start",
                                    isActive 
                                        ? "bg-white text-primary border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105" 
                                        : "bg-white/10 border-white/5 text-white/70 hover:bg-white/20 hover:text-white"
                                )}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </div>
            
            {/* Glossy top edge highlight */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
    );
}

