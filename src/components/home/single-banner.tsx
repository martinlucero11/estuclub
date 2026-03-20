'use client';
import Image from 'next/image';
import Link from 'next/link';
import type { Banner } from '@/types/data';
import { cn } from '@/lib/utils';

export function SingleBanner({ banner }: { banner: Banner | null }) {
    if (!banner) {
        return null;
    }
    
    const bannerImage = (
        <Image
            src={banner.imageUrl}
            alt={banner.title || 'Banner promocional'}
            fill
            className="object-cover"
            priority
            sizes="100vw"
        />
    );
    
    const containerClasses = "relative w-full h-24 sm:h-32 md:h-36 overflow-hidden rounded-2xl";

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
