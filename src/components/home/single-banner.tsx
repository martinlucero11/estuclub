
'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore, useDocOnce } from '@/firebase';
import { doc } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import type { Banner } from '@/types/data';
import { Skeleton } from '@/components/ui/skeleton';

export function SingleBanner({ bannerId }: { bannerId: string }) {
    const firestore = useFirestore();

    const bannerRef = useMemo(() => {
        if (!bannerId) return null;
        return doc(firestore, 'banners', bannerId).withConverter(createConverter<Banner>());
    }, [firestore, bannerId]);

    const { data: banner, isLoading } = useDocOnce(bannerRef);

    if (isLoading) {
        return <Skeleton className="aspect-[16/9] w-full rounded-2xl" />;
    }

    if (!banner) {
        return null;
    }
    
    const bannerContent = (
         <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl group">
            <Image
                src={banner.imageUrl}
                alt={banner.title || 'Banner promocional'}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority
            />
        </div>
    );
    
    if (banner.link) {
        return (
            <Link href={banner.link} target="_blank" rel="noopener noreferrer" className="block">
                {bannerContent}
            </Link>
        )
    }

    return bannerContent;
}

export default SingleBanner;
