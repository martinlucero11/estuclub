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
            width={1160}
            height={230}
            className="w-full h-auto"
            priority
        />
    );
    
    const containerClasses = "relative w-full overflow-hidden rounded-2xl";

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
