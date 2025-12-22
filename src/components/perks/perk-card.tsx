
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { SerializablePerk } from '@/lib/data';
import RedeemPerkDialog from './redeem-perk-dialog';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/firebase';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';

interface PerkCardProps {
  perk: SerializablePerk;
  className?: string;
  variant?: 'default' | 'carousel';
}

export default function PerkCard({ perk, className, variant = 'default' }: PerkCardProps) {
  const { isAdmin, isLoading } = useAdmin();

  const redeemButton = (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* The wrapping div is necessary for Tooltip to work on a disabled button */}
            <div className='w-full'> 
              <Button className="w-full" variant="default" disabled={isLoading || !isAdmin}>
                {isLoading ? 'Cargando...' : 'Canjear Beneficio'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </TooltipTrigger>
          {!isAdmin && (
            <TooltipContent>
              <p>Solo los administradores pueden canjear beneficios.</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );

  const cardContent = (
      <Card className={cn("flex h-full flex-col overflow-hidden transition-all hover:shadow-lg", className)}>
        <div className="relative h-48 w-full">
            <Image
                src={perk.imageUrl}
                alt={perk.title}
                fill
                className="object-cover"
            />
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
            <RedeemPerkDialog perk={perk} isAdmin={isAdmin}>
                {redeemButton}
            </RedeemPerkDialog>
          </CardFooter>
        </div>
      </Card>
  );

  if (variant === 'carousel') {
    const carouselCardContent = (
      <RedeemPerkDialog perk={perk} isAdmin={isAdmin} isCarouselTrigger>
        <Card className={cn("relative h-full overflow-hidden text-white transition-all hover:shadow-lg cursor-pointer", className)}>
          <Image
            src={perk.imageUrl}
            alt={perk.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex h-full flex-col justify-between p-4">
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
