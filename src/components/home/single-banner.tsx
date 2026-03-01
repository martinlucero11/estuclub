'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore, useDocOnce } from '@/firebase';
import { doc } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import type { Banner, HomeSection } from '@/types/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export function SingleBanner({ bannerId }: HomeSection) {
    const firestore = useFirestore();

    const bannerRef = useMemo(() => {
        if (!bannerId) return null;
        return doc(firestore, 'banners', bannerId).withConverter(createConverter<Banner>());
    }, [firestore, bannerId]);

    const { data: banner, isLoading } = useDocOnce(bannerRef);

    if (isLoading) {
        return <Skeleton className="aspect-video w-full rounded-2xl" />;
    }

    if (!banner) {
        return null; // Don't render anything if the banner isn't found
    }
    
    const bannerContent = (
         <Card className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden rounded-2xl group">
            <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority // Good for LCP if it's high on the page
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center items-start p-6 md:p-12 text-white">
                <h3 className="text-2xl md:text-4xl font-extrabold drop-shadow-lg max-w-lg">{banner.title}</h3>
                <p className="mt-2 text-md md:text-lg drop-shadow-md max-w-md">{banner.description}</p>
                {banner.link && (
                    <div className={cn(buttonVariants({ variant: 'default' }), "mt-6")}>
                        Ver más
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                )}
            </div>
        </Card>
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
