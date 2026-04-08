'use client';
import Link from 'next/link';
import type { Announcement } from '@/types/data';
import { cn, optimizeImage } from '@/lib/utils';
import Image from 'next/image';

export function SingleAnnouncement({ banner }: { banner: Announcement | null }) {
    if (!banner) {
        return null;
    }
    
    const bannerImage = banner.imageUrl ? (
        <Image
            src={optimizeImage(banner.imageUrl, 1200)}
            alt={banner.title || 'Anuncio promocional'}
            width={0}
            height={0}
            sizes="100vw"
            style={{ width: '100%', height: 'auto' }}
            className="block h-full w-full object-cover"
            priority={true}
        />
    ) : (
        <div className="w-full h-full bg-primary/10 flex items-center justify-center p-6 text-center">
            <h3 className="text-primary font-black text-2xl uppercase tracking-tighter italic">
                {banner.title || "ESTUCLUB"}
            </h3>
        </div>
    );
    
    const containerClasses = "relative w-full overflow-hidden rounded-3xl shadow-premium border border-primary/5 transition-all hover:scale-[1.01] aspect-[3/1]";

    if (banner.linkUrl) {
        return (
            <Link 
                href={banner.linkUrl} 
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

export default SingleAnnouncement;

