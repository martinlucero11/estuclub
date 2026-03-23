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
import { useCincoDosStatus } from '@/firebase/auth/use-cinco-dos';
import { calculateDistance, formatDistance } from '@/lib/geo-utils';
import { getLevelInfo } from '@/lib/gamification';

interface BenefitCardProps {
  benefit: SerializableBenefit & { supplierName?: string; supplierLocation?: { lat: number; lng: number } };
  className?: string;
  variant?: 'grid' | 'carousel';
  priority?: boolean;
}

export default function BenefitCard({ benefit, className, variant = 'grid', priority = false }: BenefitCardProps) {
  const { userData, userLocation, roles } = useUser();
  const { isApproved: isCincoDos } = useCincoDosStatus();
  const isAdmin = roles.includes('admin');
  
  const userLevel = useMemo(() => {
    return getLevelInfo(userData?.points || 0).level;
  }, [userData?.points]);
  
  const isLocked = useMemo(() => {
    if (isAdmin) return false;
    if (benefit.minLevel && userLevel < benefit.minLevel) return true;
    if (benefit.targetAudience === 'cinco_dos' && !isCincoDos) return true;
    return false;
  }, [benefit.minLevel, userLevel, benefit.targetAudience, isCincoDos, isAdmin]);

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
      "group relative flex w-full flex-col justify-end overflow-hidden rounded-[2.5rem] text-white transition-all duration-700 shadow-premium border border-white/5",
      !isLocked ? "hover:shadow-2xl active:scale-[0.98] hover:border-primary/30 hover:shadow-primary/10" : "cursor-not-allowed",
      variant === 'grid' ? 'aspect-[4/5]' : 'aspect-square h-48',
      className
    )}>
        <Image
            src={optimizeImage(benefit.imageUrl, 800)}
            alt={benefit.title}
            fill
            className={cn(
                "object-cover transition-transform duration-1000 ease-in-out",
                !isLocked ? "group-hover:scale-110" : "grayscale opacity-40"
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
        />
        <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-500",
            isLocked ? "from-black/95 via-black/70" : "group-hover:from-primary/40 group-hover:via-black/40"
        )} />
        
        {isLocked && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center space-y-3">
                <div className="bg-black/40 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-2xl">
                    <Lock className="h-6 w-6 text-yellow-500 animate-pulse" />
                </div>
                <Badge className="bg-yellow-500/90 backdrop-blur-md text-black font-black uppercase tracking-tighter border-0 shadow-lg text-[10px] px-3 py-1">
                    Nivel {benefit.minLevel}+
                </Badge>
            </div>
        )}

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-30">
            <div className="flex flex-col gap-2">
                <Badge variant="secondary" className="bg-black/30 backdrop-blur-md text-white/90 border-white/10 py-1 px-3 glass shadow-inner text-[9px] font-black uppercase tracking-widest leading-none w-fit">
                    {benefit.category}
                </Badge>
                
                {benefit.minLevel && (
                    <Badge className={cn(
                        "w-fit text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg border shadow-lg transition-all duration-500",
                        !isLocked 
                            ? "bg-green-500/80 text-white border-green-400/30" 
                            : "bg-yellow-500/80 text-black border-yellow-400/30"
                    )}>
                        {isLocked ? `Nivel ${benefit.minLevel}+` : `Nivel ${benefit.minLevel} Desbloqueado`}
                    </Badge>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <FavoriteButton 
                    id={benefit.id} 
                    type="benefit" 
                    className="bg-black/30 backdrop-blur-md border-white/10 hover:bg-pink-600/50 shadow-xl" 
                />
            </div>
        </div>

        {distance !== null && !isLocked && (
            <div className="absolute top-16 right-4 z-30 animate-in fade-in slide-in-from-right-4 duration-700">
                <div className="glass glass-dark px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-black/60 backdrop-blur-2xl">
                    <MapPin className="h-3 w-3 text-primary animate-pulse" />
                    <span className="text-[10px] font-black tracking-tight text-white leading-none">{formatDistance(distance)}</span>
                </div>
            </div>
        )}

        <div className="relative z-10 flex h-full flex-col justify-end p-6 text-left">
            <div className='space-y-1.5'>
                <h3 className={cn(
                    "font-black uppercase tracking-tighter leading-[0.9] mb-1",
                    "text-xl md:text-2xl group-hover:text-primary transition-all duration-500 group-hover:scale-[1.02] origin-left",
                    "drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                )}>
                    {primaryText}
                </h3>
            </div>
            
            <div className="pt-3 flex items-center justify-between border-t border-white/15 mt-3 transition-colors duration-500 group-hover:border-primary/30">
                <div className="flex items-center gap-2 text-[9px] text-white/60 font-black uppercase tracking-[0.15em]">
                    <Building className="h-3 w-3 opacity-50" />
                    <span className="truncate max-w-[120px]">{supplierName}</span>
                </div>
                
                <div className="h-7 w-7 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-primary group-hover:border-primary group-hover:scale-110 transition-all duration-500 shadow-lg">
                    <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
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
