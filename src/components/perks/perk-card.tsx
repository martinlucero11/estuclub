
'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import type { SerializableBenefit } from '@/types/data';
import { Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDocOnce } from '@/firebase';
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
  const isGrid = variant === 'grid';

  const primaryText = benefit.highlight || benefit.title;
  const secondaryText = benefit.highlight ? benefit.title : benefit.description;

  return (
    <RedeemBenefitDialog benefit={benefit}>
      <Card className={cn("group relative flex aspect-[2/1] w-full flex-col justify-end overflow-hidden rounded-2xl text-white transition-all duration-300 hover:shadow-xl", className)}>
        <Image
          src={benefit.imageUrl}
          alt={benefit.title}
          fill
          className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className={cn("relative z-10 space-y-2 p-4 md:p-5", isGrid ? 'space-y-3' : 'space-y-1')}>
            <div className="space-y-1">
                 <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-0">{benefit.category}</Badge>
                <h3 className={cn(
                    "font-extrabold uppercase tracking-tight line-clamp-2",
                    isGrid ? 'text-3xl' : 'text-xl'
                )}>
                    {primaryText}
                </h3>
                {secondaryText && (
                  <p className={cn(
                      "font-medium text-white/80 line-clamp-2",
                      isGrid ? 'text-base' : 'text-sm'
                    )}>
                      {secondaryText}
                  </p>
                )}
            </div>
            
            <div className="pt-2">
                <div className="flex items-center gap-2 text-xs text-white/70">
                    <Building className="h-4 w-4" />
                    <span>{supplierName}</span>
                </div>
            </div>
        </div>
      </Card>
    </RedeemBenefitDialog>
  );
}
