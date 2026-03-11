
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { SerializableBenefit } from '@/types/data';
import { Building, MapPin, Award, Flame, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDocOnce } from '@/firebase';
import { Button } from '../ui/button';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { doc } from 'firebase/firestore';

const RedeemBenefitDialog = dynamic(() => import('./redeem-perk-dialog'), {
  ssr: false,
  loading: () => <Button className="w-full" disabled>Cargando...</Button>
});

interface BenefitCardProps {
  benefit: SerializableBenefit;
  className?: string;
  variant?: 'default' | 'carousel';
}

// Badge para beneficios destacados
const FeaturedBadge = () => (
  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white shadow-lg">
    <Flame className="h-3 w-3" />
    <span>Destacado</span>
  </div>
);

export default function BenefitCard({ benefit, className, variant = 'default' }: BenefitCardProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const supplierRef = useMemo(() => {
    if (!benefit.ownerId) return null;
    return doc(firestore, 'roles_supplier', benefit.ownerId);
  }, [firestore, benefit.ownerId]);

  const { data: supplier } = useDocOnce(supplierRef);

  const redeemButton = (
      <Button className="w-full" variant="default" disabled={isUserLoading || !user}>
        {isUserLoading ? 'Cargando...' : 'Canjear Beneficio'}
        {!isUserLoading && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
    );

  const cardContent = (
      <Card className={cn("flex h-full flex-col overflow-hidden transition-all duration-200 hover:shadow-lg active:scale-95", className)}>
        <div className="relative w-full aspect-video">
            <Image
                src={benefit.imageUrl}
                alt={benefit.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Premium gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/30 to-transparent" />

            {benefit.isFeatured && <FeaturedBadge />}

            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
                <Award className="h-3 w-3" />
                <span>{benefit.points} PTS</span>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <CardTitle className="line-clamp-2 text-xl text-white">{benefit.title}</CardTitle>
                <CardDescription className="text-white/80">{benefit.category}</CardDescription>
            </div>
        </div>
        <div className='flex flex-1 flex-col p-4'>
          <CardContent className="flex-grow space-y-3 p-0">
            <p className="text-sm text-muted-foreground line-clamp-2">{benefit.description}</p>
              {supplier && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="h-4 w-4 flex-shrink-0" />
                    <span>{supplier.name}</span>
                </div>
            )}
            {benefit.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{benefit.location}</span>
                </div>
            )}
          </CardContent>
          <CardFooter className="p-0 pt-4">
            <RedeemBenefitDialog benefit={benefit}>
                {redeemButton}
            </RedeemBenefitDialog>
          </CardFooter>
        </div>
      </Card>
  );

  if (variant === 'carousel') {
    return (
      <RedeemBenefitDialog benefit={benefit} isCarouselTrigger>
        <Card className={cn("relative aspect-video overflow-hidden text-white transition-all duration-200 hover:shadow-lg active:scale-95 cursor-pointer", className)}>
            <Image
              src={benefit.imageUrl}
              alt={benefit.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-end p-4">
            {benefit.isFeatured && <FeaturedBadge />}
            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
                <Award className="h-3 w-3" />
                <span>{benefit.points} PTS</span>
            </div>
            <div>
              <CardTitle className="text-xl line-clamp-2">{benefit.title}</CardTitle>
              <CardDescription className='text-white/80'>{benefit.category}</CardDescription>
              {supplier && (
                <div className="flex items-center gap-2 text-xs text-white/80 pt-1">
                    <Building className="h-3 w-3" />
                    <span>{supplier.name}</span>
                </div>
            )}
            </div>
          </div>
        </Card>
      </RedeemBenefitDialog>
    );
  }

  return cardContent;
}
