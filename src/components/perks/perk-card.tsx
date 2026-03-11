
'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
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
}

export default function BenefitCard({ benefit, className }: BenefitCardProps) {
  const firestore = useFirestore();

  const supplierRef = useMemo(() => {
    if (!benefit.ownerId) return null;
    return doc(firestore, 'roles_supplier', benefit.ownerId);
  }, [firestore, benefit.ownerId]);

  const { data: supplier } = useDocOnce(supplierRef);

  const CategoryIcon = categoryIcons[benefit.category as BenefitCategory] || Gift;
  const supplierName = supplier?.name || "Club de Beneficios";

  // The whole card is a trigger for the dialog
  return (
    <RedeemBenefitDialog benefit={benefit}>
      <Card className={cn(
        "group relative aspect-[16/9] w-full cursor-pointer overflow-hidden rounded-2xl text-white shadow-lg",
        "transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-2xl",
        className
      )}>
        
        {/* Background Image */}
        <Image
          src={benefit.imageUrl}
          alt={benefit.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Glassmorphism Info Box */}
        <div className="absolute inset-x-4 top-4 bottom-4 z-10 m-auto flex h-fit max-w-[90%] flex-col rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-lg md:p-6">
          
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase text-white drop-shadow-lg md:text-4xl lg:text-5xl">
              {benefit.title}
            </h2>
            <p className="mt-1 text-base font-bold text-white/90 drop-shadow-md md:text-lg">
              {benefit.description}
            </p>
          </div>
          
          <div className="mt-4 flex justify-center">
             <div className="flex items-center gap-2 rounded-full bg-primary/90 px-4 py-1.5 text-sm font-semibold text-primary-foreground">
                <CategoryIcon className="h-4 w-4" />
                <span>{benefit.category}</span>
             </div>
          </div>

          <hr className="my-3 border-t-2 border-dashed border-white/20 md:my-4" />
          
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-white/80">
             <Gift className="h-4 w-4" />
             <span>Subido por {supplierName}</span>
          </div>

        </div>
      </Card>
    </RedeemBenefitDialog>
  );
}
