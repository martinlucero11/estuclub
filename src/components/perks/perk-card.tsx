'use client';

import Image from 'next/image';
import type { SerializableBenefit } from '@/types/data';
import { Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useDocOnce } from '@/firebase';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { Badge } from '../ui/badge';

const RedeemBenefitDialog = dynamic(() => import('./redeem-perk-dialog'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-secondary animate-pulse rounded-2xl" />
});

interface BenefitCardProps {
  benefit: SerializableBenefit;
  className?: string;
  variant?: 'grid' | 'carousel';
}

export default function BenefitCard({ benefit, className, variant = 'grid' }: BenefitCardProps) {
  const firestore = useFirestore();

  const supplierRef = useMemo(() => {
    if (!benefit.ownerId) return null;
    return doc(firestore, 'roles_supplier', benefit.ownerId);
  }, [firestore, benefit.ownerId]);

  const { data: supplier } = useDocOnce(supplierRef);

  const supplierName = supplier?.name || "Club de Beneficios";

  const primaryText = benefit.highlight || benefit.title;
  // If highlight exists, title becomes secondary. If not, description is not shown on cards anymore to keep it clean.
  const secondaryText = benefit.highlight ? benefit.title : '';

  return (
    <RedeemBenefitDialog benefit={benefit}>
        {/* The main container div. aspect-ratio controls the shape. */}
        <div className={cn(
          "group relative flex w-full flex-col justify-end overflow-hidden rounded-2xl text-white transition-all duration-300 hover:shadow-xl",
          // The variant dictates the aspect ratio: taller for grid, wider for carousel
          variant === 'grid' ? 'aspect-[3/4]' : 'aspect-video',
          className
        )}>
            <Image
                src={benefit.imageUrl}
                alt={benefit.title}
                fill
                className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Aggressive overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            
            <Badge variant="secondary" className="absolute top-3 left-3 bg-white/20 text-white backdrop-blur-sm border-0 z-20">
                {benefit.category}
            </Badge>

            {/* Content container at the bottom */}
            <div className="relative z-10 flex h-full flex-col justify-end p-4 text-left">
                <div className='space-y-1'>
                    <h3 className={cn(
                        "font-bold uppercase tracking-tight line-clamp-3",
                        // Dynamic font size based on variant
                        "text-2xl md:text-3xl"
                    )}>
                        {primaryText}
                    </h3>
                    {secondaryText && (
                      <p className={cn(
                          "font-medium text-white/90 line-clamp-2",
                          "text-base"
                        )}>
                          {secondaryText}
                      </p>
                    )}
                </div>
                
                {/* Supplier info at the bottom */}
                <div className="pt-4">
                    <div className="flex items-center gap-2 text-xs text-white/70">
                        <Building className="h-4 w-4" />
                        <span>{supplierName}</span>
                    </div>
                </div>
            </div>
        </div>
    </RedeemBenefitDialog>
  );
}
