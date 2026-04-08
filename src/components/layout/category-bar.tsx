import React, { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Category } from '@/types/data';
import { haptic } from '@/lib/haptics';
import { useFirestore, useCollectionOnce } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import { getCategoryEmoji } from '@/lib/category-utils';

export function CategoryBar() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const firestore = useFirestore();
    
    const isDelivery = pathname.startsWith('/delivery') || pathname.startsWith('/proveedores');
    const type = isDelivery ? 'delivery' : 'benefits';
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
        return dbCategories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
    if (!showBar || (isLoading && !dbCategories)) return null;

    return (
        <div className="w-full bg-black/5 dark:bg-white/5 py-3 overflow-hidden border-t border-white/10 relative">
            <div className="container px-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar snap-x snap-mandatory">
                        <button
                        key="all"
                        onClick={() => handleCategoryClick(null)}
                        className={cn(
                            "whitespace-nowrap px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 border-2 snap-start flex items-center gap-2",
                            !currentCategory 
                                ? "bg-primary text-white border-primary shadow-[0_0_20px_rgba(203,70,90,0.3)] scale-105" 
                                : "bg-card border-black/5 dark:border-white/5 text-foreground/60 hover:border-primary/30 hover:text-primary"
                        )}
                    >
                        <span>🏠</span>
                        <span>Todos</span>
                    </button>
                    {categories.map((cat) => {
                        const isActive = currentCategory === cat.name;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.name)}
                                className={cn(
                                    "whitespace-nowrap px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 border-2 snap-start flex items-center gap-2",
                                    isActive 
                                        ? "bg-primary text-white border-primary shadow-[0_0_20px_rgba(203,70,90,0.3)] scale-105" 
                                        : "bg-card border-black/5 dark:border-white/5 text-foreground/60 hover:border-primary/30 hover:text-primary"
                                )}
                            >
                                <span>{cat.emoji || getCategoryEmoji(cat.name)}</span>
                                <span>{cat.name}</span>
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

