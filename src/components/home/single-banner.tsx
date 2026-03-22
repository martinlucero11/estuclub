'use client';
import Link from 'next/link';
import type { Banner } from '@/types/data';
import { cn } from '@/lib/utils';

export function SingleBanner({ banner }: { banner: Banner | null }) {
    if (!banner) {
        return null;
    }
    
    // We use a standard img tag instead of next/image here because banners 
    // should have a dynamic aspect ratio based on the uploaded image file.
    // Standard img with w-full h-auto is the most reliable way to achieve this.
    const bannerImage = (
        <img
            src={banner.imageUrl}
            alt={banner.title || 'Banner promocional'}
            className="w-full h-auto block"
            loading="eager"
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
