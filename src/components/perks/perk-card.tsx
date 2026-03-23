'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import type { SerializableBenefit } from '@/types/data';
import { Building, MapPin, Lock } from 'lucide-react';
import { cn, optimizeImage } from '@/lib/utils';
import { Badge } from '../ui/badge';
import RedeemBenefitDialog from './redeem-perk-dialog';
import { FavoriteButton } from '../layout/favorite-button';
import { useUser } from '@/firebase';
import { calculateDistance, formatDistance } from '@/lib/geo-utils';

interface BenefitCardProps {
  benefit: SerializableBenefit & { supplierName?: string; supplierLocation?: { lat: number; lng: number } };
  className?: string;
  variant?: 'grid' | 'carousel';
  priority?: boolean;
}

export default function BenefitCard({ benefit, className, variant = 'grid', priority = false }: BenefitCardProps) {
  const { userData, userLocation } = useUser();
  const userLevel = userData?.level || 1;
  const isLocked = benefit.minLevel ? userLevel < benefit.minLevel : false;

  const supplierName = benefit.supplierName || "Club de Beneficios";
  
  // Calculate distance if both locations are available
  const distance = useMemo(() => {
    if (userLocation && benefit.supplierLocation) {
        return calculateDistance(
            userLocation.lat, userLocation.lng,
            benefit.supplierLocation.lat, benefit.supplierLocation.lng
        );
    }
    return null;
  }, [userLocation, benefit.supplierLocation]);

  const primaryText = benefit.highlight || benefit.title;

  const cardContent = (
    <div className={cn(
      "group relative flex w-full flex-col justify-end overflow-hidden rounded-[2.5rem] text-white transition-all duration-500 shadow-premium border border-white/5",
      !isLocked ? "hover:shadow-2xl active:scale-[0.98] hover:border-primary/20" : "cursor-not-allowed",
      variant === 'grid' ? 'aspect-[4/5]' : 'aspect-square h-48',
      className
    )}>
        <Image
            src={optimizeImage(benefit.imageUrl, 800)}
            alt={benefit.title}
            fill
            className={cn(
                "object-cover transition-transform duration-700 ease-out",
                !isLocked ? "group-hover:scale-110" : "grayscale opacity-40"
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
        />
        <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent",
            isLocked && "from-black/95 via-black/60"
        )} />
        
        {isLocked && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center space-y-3">
                <div className="bg-black/40 backdrop-blur-xl p-4 rounded-full border border-white/10 shadow-2xl">
                    <Lock className="h-6 w-6 text-yellow-500 animate-pulse" />
                </div>
                <Badge className="bg-yellow-500/90 backdrop-blur-sm text-black font-black uppercase tracking-tighter border-0 shadow-lg text-[10px]">
                    Nivel {benefit.minLevel}+
                </Badge>
            </div>
        )}

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-30">
            <Badge variant="secondary" className="bg-black/30 backdrop-blur-md text-white/90 border-white/5 py-1 px-3 glass shadow-inner text-[10px] font-black uppercase tracking-widest">
                {benefit.category}
            </Badge>

            <div className="flex flex-col gap-2">
                <FavoriteButton 
                    id={benefit.id} 
                    type="benefit" 
                    className="bg-black/20 backdrop-blur-sm border-white/10 hover:bg-pink-600/50" 
                />
            </div>
        </div>

        {distance !== null && !isLocked && (
            <div className="absolute top-16 right-4 z-30 animate-in fade-in slide-in-from-right-2 duration-500">
                <div className="glass glass-dark px-2 py-1 rounded-lg border-white/10 flex items-center gap-1.5 shadow-xl">
                    <MapPin className="h-3 w-3 text-primary animate-pulse" />
                    <span className="text-[10px] font-black tracking-tighter">{formatDistance(distance)}</span>
                </div>
            </div>
        )}

        <div className="relative z-10 flex h-full flex-col justify-end p-5 text-left">
            <div className='space-y-1.5'>
                <h3 className={cn(
                    "font-black uppercase tracking-tighter leading-none mb-1",
                    "text-xl md:text-2xl group-hover:text-primary transition-colors duration-300"
                )}>
                    {primaryText}
                </h3>
            </div>
            
            <div className="pt-3 flex items-center justify-between border-t border-white/10 mt-3">
                <div className="flex items-center gap-2 text-[10px] text-white/60 font-black uppercase tracking-widest">
                    <Building className="h-3 w-3 opacity-50" />
                    <span className="truncate max-w-[120px]">{supplierName}</span>
                </div>
                
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:bg-primary group-hover:scale-110 transition-all duration-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary group-hover:bg-white" />
                </div>
            </div>
        </div>
    </div>
  );

  if (isLocked) {
      return cardContent;
  }

  return (
    <RedeemBenefitDialog benefit={benefit}>
        {cardContent}
    </RedeemBenefitDialog>
  );
}
