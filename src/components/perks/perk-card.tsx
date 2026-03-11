
'use client';

import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import type { SerializableBenefit, BenefitCategory } from '@/types/data';
import { Building, Award, Flame, Plane, Gift, ShoppingCart, Ticket, Music, GraduationCap, Utensils, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDocOnce } from '@/firebase';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { doc } from 'firebase/firestore';

const RedeemBenefitDialog = dynamic(() => import('./redeem-perk-dialog'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-secondary animate-pulse rounded-2xl" />
});

// Icon mapping for benefit categories
const categoryIcons: Record<BenefitCategory, LucideIcon> = {
  Turismo: Plane,
  Comercios: ShoppingCart,
  Eventos: Ticket,
  Comida: Utensils,
  Educación: GraduationCap,
  Entretenimiento: Music,
};

interface BenefitCardProps {
  benefit: SerializableBenefit;
  className?: string;
  variant?: 'default' | 'carousel';
}

export default function BenefitCard({ benefit, className, variant = 'default' }: BenefitCardProps) {
  const firestore = useFirestore();

  const supplierRef = useMemo(() => {
    if (!benefit.ownerId) return null;
    return doc(firestore, 'roles_supplier', benefit.ownerId);
  }, [firestore, benefit.ownerId]);

  const { data: supplier } = useDocOnce(supplierRef);

  const CategoryIcon = categoryIcons[benefit.category as BenefitCategory] || Gift;
  const supplierName = supplier?.name || "Club de Beneficios";

  // Carousel variant - a compact, horizontal version
  if (variant === 'carousel') {
    return (
      <RedeemBenefitDialog benefit={benefit} isCarouselTrigger>
        <Card className={cn("group relative h-full w-full cursor-pointer overflow-hidden rounded-2xl text-white shadow-lg", className)}>
          <Image
            src={benefit.imageUrl}
            alt={benefit.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          <div className="relative z-10 flex h-full flex-col justify-end p-3">
            <h3 className="text-base font-bold leading-tight line-clamp-2">{benefit.title}</h3>
            <p className="mt-0.5 text-xs text-white/80 line-clamp-1">{supplierName}</p>
          </div>
        </Card>
      </RedeemBenefitDialog>
    );
  }

  // Default variant - the larger card for grids
  return (
    <RedeemBenefitDialog benefit={benefit}>
      <Card className={cn("group flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-xl", className)}>
        <div className="relative aspect-video w-full">
          <Image
            src={benefit.imageUrl}
            alt={benefit.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-primary/20 to-transparent" />
          {benefit.isFeatured && (
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
              <Flame className="h-4 w-4" /><span>Destacado</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <CategoryIcon className="h-4 w-4" />
            <span>{benefit.category}</span>
          </div>
          <h3 className="mt-2 text-lg font-bold text-foreground line-clamp-2">{benefit.title}</h3>
          <div className="mt-auto flex items-center justify-between pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="h-4 w-4" />
              <span className="truncate">{supplierName}</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-primary">
              <Award className="h-4 w-4" />
              <span>{benefit.points} PTS</span>
            </div>
          </div>
        </div>
      </Card>
    </RedeemBenefitDialog>
  );
}
