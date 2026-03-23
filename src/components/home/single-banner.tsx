'use client';
import Link from 'next/link';
import type { Banner } from '@/types/data';
import { cn, optimizeImage } from '@/lib/utils';
import Image from 'next/image';

export function SingleBanner({ banner }: { banner: Banner | null }) {
    if (!banner) {
        return null;
    }
    
    const bannerImage = (
        <Image
            src={optimizeImage(banner.imageUrl, 1200)}
            alt={banner.title || 'Banner promocional'}
            width={0}
            height={0}
            sizes="100vw"
            style={{ width: '100%', height: 'auto' }}
            className="block"
            priority={true}
        />
    );
    
    const containerClasses = "relative w-full overflow-hidden rounded-3xl shadow-premium border border-primary/5 transition-all hover:scale-[1.01]";

    if (banner.link) {
        return (
            <Link 
                href={banner.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={cn("block", containerClasses)}
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
