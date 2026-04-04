'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import type { SerializableBenefit } from '@/types/data';
import { Building, MapPin, Lock } from 'lucide-react';
import { cn, optimizeImage } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { FavoriteButton } from '../layout/favorite-button';
import { useUser } from '@/firebase';
import { useCincoDosStatus } from '@/firebase/auth/use-cinco-dos';
import { calculateDistance, formatDistance } from '@/lib/geo-utils';
import { getLevelInfo } from '@/lib/gamification';
import dynamic from 'next/dynamic';

const RedeemPerkDialog = dynamic(() => import('./redeem-perk-dialog'), {
  ssr: false,
});

interface PerkCardProps {
  perk: SerializableBenefit & { supplierName?: string; supplierLocation?: { lat: number; lng: number } };
  className?: string;
  variant?: 'grid' | 'carousel';
  priority?: boolean;
}

const DEFAULT_PERK_IMAGE = "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&q=80&w=800";

export default function PerkCard({ perk, className, variant = 'grid', priority = false }: PerkCardProps) {
  const { userData, userLocation, roles } = useUser();
  const { isApproved: isCincoDos } = useCincoDosStatus();
  const isAdmin = roles.includes('admin');
  
  const userLevel = useMemo(() => {
    return getLevelInfo(userData?.points || 0).level;
  }, [userData?.points]);
  
  const isLocked = useMemo(() => {
    if (isAdmin) return false;
    if (perk.minLevel && userLevel < perk.minLevel) return true;
    if (perk.isCincoDosOnly && !isCincoDos) return true;
    if (perk.isStudentOnly && roles.length > 0 && !roles.includes('user_student') && !roles.includes('admin')) return true;
    return false;
  }, [perk.minLevel, userLevel, perk.isCincoDosOnly, perk.isStudentOnly, isCincoDos, isAdmin, roles]);

  const supplierName = perk.supplierName || "Club de Beneficios";
  
  // Calculate distance if both locations are available
  const distance = useMemo(() => {
    if (userLocation && perk.supplierLocation) {
        return calculateDistance(
            userLocation.lat, userLocation.lng,
            perk.supplierLocation.lat, perk.supplierLocation.lng
        );
    }
    return null;
  }, [userLocation, perk.supplierLocation]);

  const primaryText = perk.highlight || perk.title;

  const cardContent = (
    <div className={cn(
      "group relative flex w-full flex-col justify-end overflow-hidden rounded-[2.5rem] text-white transition-all duration-700 shadow-premium border border-white/5",
      !isLocked ? "hover:shadow-2xl active:scale-[0.98] hover:border-primary/30 hover:shadow-primary/10" : "cursor-not-allowed",
      variant === 'grid' ? 'aspect-[4/5]' : 'h-[260px] w-full sm:h-[280px]',
      className
    )}>
        <Image
            src={optimizeImage(perk.imageUrl || DEFAULT_PERK_IMAGE, 800)}
            alt={perk.title}
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
                    Nivel {perk.minLevel}+
                </Badge>
            </div>
        )}

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-30 font-bold group">
            <div className="flex flex-col gap-2">
                <div className="bg-primary text-white border border-white/30 py-1.5 px-4 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest leading-none w-fit shadow-lg">
                    {perk.category}
                </div>
                
                {perk.minLevel && (
                    <Badge className={cn(
                        "w-fit text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-lg border shadow-lg transition-all duration-500",
                        !isLocked 
                            ? "bg-green-500 text-white border-green-400/30" 
                            : "bg-yellow-500 text-black border-yellow-400/30"
                    )}>
                        {isLocked ? `Nivel ${perk.minLevel}+` : `Nivel ${perk.minLevel} Desbloqueado`}
                    </Badge>
                )}

                {distance !== null && !isLocked && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1.5 shadow-lg scale-100 group-hover:scale-110 transition-all duration-500 cursor-default w-fit">
                            <MapPin className="h-3 w-3 text-white fill-current/20" />
                            <span className="text-[10px] font-black tracking-tight text-white leading-none drop-shadow-md">{formatDistance(distance)}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <FavoriteButton 
                    id={perk.id} 
                    type="benefit" 
                    className="bg-black/40 backdrop-blur-md border-white/20 hover:bg-primary shadow-xl" 
                />
            </div>
        </div>


        <div className="relative z-10 flex h-full flex-col justify-end p-6 text-left">
            <div className='space-y-1.5'>
                <h3 className={cn(
                    "font-black uppercase tracking-tighter leading-[0.9] mb-1",
                    "text-xl md:text-2xl group-hover:text-primary transition-all duration-500 group-hover:scale-[1.02] origin-left",
                    "drop-shadow-[0_4px_8_rgba(0,0,0,0.8)]"
                )}>
                    {primaryText}
                </h3>
            </div>
            
            <div className="pt-3 flex items-center justify-between border-t border-white/20 mt-3 transition-colors duration-500 group-hover:border-primary/40">
                <div className="flex items-center gap-2 text-xs text-white font-black uppercase tracking-[0.15em] drop-shadow-md">
                    <Building className="h-3.5 w-3.5 opacity-90" />
                    <span className="truncate max-w-[150px]">{supplierName}</span>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <RedeemPerkDialog perk={perk}>
        {cardContent}
    </RedeemPerkDialog>
  );
}

