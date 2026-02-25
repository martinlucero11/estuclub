
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { SerializableBenefit } from '@/types/data';
import { MapPin, Award, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';

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
            {/* Gradiente para legibilidad */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            {benefit.isFeatured && <FeaturedBadge />}

            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-primary/80 px-2 py-1 text-xs font-bold text-primary-foreground backdrop-blur-sm">
                <Award className="h-3 w-3" />
                <span>{benefit.points} PTS</span>
            </div>
        </div>
        <div className='flex flex-1 flex-col'>
          <CardHeader>
            <CardTitle className="line-clamp-2 text-xl">{benefit.title}</CardTitle>
            <CardDescription>{benefit.category}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-2">
            <p className="text-sm text-muted-foreground line-clamp-3">{benefit.description}</p>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
             {benefit.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{benefit.location}</span>
                </div>
            )}
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
        <Card className={cn("relative h-full overflow-hidden text-white transition-all duration-200 hover:shadow-lg active:scale-95 cursor-pointer", className)}>
            <Image
              src={benefit.imageUrl}
              alt={benefit.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
          <div className="relative z-10 flex h-full flex-col justify-end p-4">
            {benefit.isFeatured && <FeaturedBadge />}
            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-primary/80 px-2 py-1 text-xs font-bold text-primary-foreground backdrop-blur-sm">
                <Award className="h-3 w-3" />
                <span>{benefit.points} PTS</span>
            </div>
            <div>
              <CardTitle className="text-xl line-clamp-2">{benefit.title}</CardTitle>
              <CardDescription className='text-gray-300'>{benefit.category}</CardDescription>
            </div>
          </div>
        </Card>
      </RedeemBenefitDialog>
    );
  }

  return cardContent;
}
