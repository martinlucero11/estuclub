'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore, useDocOnce } from '@/firebase';
import { doc } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import type { Banner } from '@/types/data';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function SingleBanner({ bannerId }: { bannerId: string }) {
    const firestore = useFirestore();

    const bannerRef = useMemo(() => {
        if (!bannerId) return null;
        return doc(firestore, 'banners', bannerId).withConverter(createConverter<Banner>());
    }, [firestore, bannerId]);

    const { data: banner, isLoading } = useDocOnce(bannerRef);

    if (isLoading) {
        return <Skeleton className="aspect-[1160/230] w-full rounded-2xl" />;
    }

    if (!banner) {
        return null;
    }
    
    const bannerImage = (
        <Image
            src={banner.imageUrl}
            alt={banner.title || 'Banner promocional'}
            width={1160}
            height={230}
            className="w-full h-auto" // Let Next/Image handle the aspect ratio
            priority
        />
    );
    
    const containerClasses = "relative w-full overflow-hidden rounded-2xl"; // Keep rounding and overflow on container

    if (banner.link) {
        return (
            <Link 
                href={banner.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={cn(containerClasses)}
            >
                {bannerImage}
            </Link>
        )
    }

    return (
        <div className={cn(containerClasses)}>
            {bannerImage}
        </div>
    );
}

export default SingleBanner;
