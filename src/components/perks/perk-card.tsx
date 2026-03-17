'use client';

import Image from 'next/image';
import type { SerializableBenefit } from '@/types/data';
import { Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import RedeemBenefitDialog from './redeem-perk-dialog';

interface BenefitCardProps {
  benefit: SerializableBenefit & { supplierName?: string };
  className?: string;
  variant?: 'grid' | 'carousel';
}

export default function BenefitCard({ benefit, className, variant = 'grid' }: BenefitCardProps) {
  const supplierName = benefit.supplierName || "Club de Beneficios";

  const primaryText = benefit.highlight || benefit.title;
  const secondaryText = benefit.highlight ? benefit.title : '';

  const cardContent = (
    <div className={cn(
      "group relative flex w-full flex-col justify-end overflow-hidden rounded-2xl text-white transition-all duration-300 hover:shadow-xl",
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        
        <Badge variant="secondary" className="absolute top-3 left-3 bg-pink-600 text-white border-0 z-20">
            {benefit.category}
        </Badge>

        <div className="relative z-10 flex h-full flex-col justify-end p-4 text-left">
            <div className='space-y-1'>
                <h3 className={cn(
                    "font-bold uppercase tracking-tight line-clamp-3",
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
            
            <div className="pt-4">
                <div className="flex items-center gap-2 text-xs text-white/70">
                    <Building className="h-4 w-4" />
                    <span>{supplierName}</span>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <RedeemBenefitDialog benefit={benefit}>
        {cardContent}
    </RedeemBenefitDialog>
  );
}
