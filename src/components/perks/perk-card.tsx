
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { SerializablePerk } from '@/lib/data';
import { MapPin, Award, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';

const RedeemPerkDialog = dynamic(() => import('./redeem-perk-dialog'), {
  ssr: false,
  loading: () => <Button className="w-full" disabled>Cargando...</Button>
});

interface PerkCardProps {
  perk: SerializablePerk;
  className?: string;
  variant?: 'default' | 'carousel';
}

// Badge para beneficios destacados
const FeaturedBadge = () => (
  <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white shadow-lg">
    <Flame className="h-3 w-3" />
    <span>Destacado</span>
  </div>
);

export default function PerkCard({ perk, className, variant = 'default' }: PerkCardProps) {
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
                src={perk.imageUrl}
                alt={perk.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Gradiente para legibilidad */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            {perk.isFeatured && <FeaturedBadge />}

            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-primary/80 px-2 py-1 text-xs font-bold text-primary-foreground backdrop-blur-sm">
                <Award className="h-3 w-3" />
                <span>{perk.points} PTS</span>
            </div>
        </div>
        <div className='flex flex-1 flex-col'>
          <CardHeader>
            <CardTitle className="line-clamp-2 text-xl">{perk.title}</CardTitle>
            <CardDescription>{perk.category}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-2">
            <p className="text-sm text-muted-foreground line-clamp-3">{perk.description}</p>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
             {perk.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{perk.location}</span>
                </div>
            )}
            <RedeemPerkDialog perk={perk}>
                {redeemButton}
            </RedeemPerkDialog>
          </CardFooter>
        </div>
      </Card>
  );

  if (variant === 'carousel') {
    const carouselCardContent = (
      <RedeemPerkDialog perk={perk} isCarouselTrigger>
        <Card className={cn("relative h-full overflow-hidden text-white transition-all duration-200 hover:shadow-lg active:scale-95 cursor-pointer", className)}>
          <div className="w-full aspect-video relative">
            <Image
              src={perk.imageUrl}
              alt={perk.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex h-full flex-col justify-between p-4">
            {perk.isFeatured && <FeaturedBadge />}
            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-primary/80 px-2 py-1 text-xs font-bold text-primary-foreground backdrop-blur-sm">
                <Award className="h-3 w-3" />
                <span>{perk.points} PTS</span>
            </div>
            <div className='flex-grow'>
              <CardTitle className="text-xl line-clamp-2">{perk.title}</CardTitle>
              <CardDescription className='text-gray-300'>{perk.category}</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              {perk.location && (
                <>
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>{perk.location}</span>
                </>
              )}
            </div>
          </div>
        </Card>
      </RedeemPerkDialog>
    );

    return carouselCardContent;
  }

  return cardContent;
}
