'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import { StarRating } from './star-rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;      // Supplier rating or generic
  riderRating?: number; // Specific rider rating
  comment: string;
  createdAt: any;
  type: string;
}

interface ReviewListProps {
  entityId: string;
  type?: 'supplier' | 'rider';
}

export function ReviewList({ entityId, type = 'supplier' }: ReviewListProps) {
  const firestore = useFirestore();

  const reviewsQuery = useMemo(() => {
    // Determine filter field based on type
    const filterField = type === 'rider' ? 'riderId' : 'supplierId';
    
    return query(
      collection(firestore, 'reviews').withConverter(createConverter<Review>()),
      where(filterField, '==', entityId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  }, [firestore, entityId, type]);

  const { data: reviews, isLoading } = useCollection(reviewsQuery);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-background/20 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center">
        <MessageSquare className="h-10 w-10 text-foreground/30 mb-2" />
        <p className="text-foreground font-black uppercase tracking-widest text-[10px]">Sin opiniones aún</p>
        <p className="text-[9px] text-foreground/40 mt-1 uppercase tracking-tighter">¡Sé el primero en calificar este servicio!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        // Use either riderRating or standardized rating based on type
        const displayRating = type === 'rider' ? (review.riderRating || review.rating) : review.rating;

        return (
          <div key={review.id} className="p-6 rounded-[2rem] border bg-white/50 backdrop-blur-sm shadow-sm space-y-4 transition-all hover:bg-white/80">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-primary/10 shadow-sm">
                  <AvatarImage src={review.userPhoto} alt={review.userName} />
                  <AvatarFallback className="font-extrabold bg-primary/5 text-primary">{getInitials(review.userName)}</AvatarFallback>
                </Avatar>
                <div className="space-y-0.5">
                  <p className="text-sm font-black italic uppercase tracking-tighter text-foreground">{review.userName}</p>
                  <StarRating rating={displayRating} readonly size="sm" className="mt-0.5" />
                </div>
              </div>
              <div className="text-right">
                  <div className="flex items-center gap-1.5 text-[10px] text-foreground/40 font-black uppercase tracking-widest">
                      <Calendar className="h-3 w-3" />
                      {review.createdAt?.toDate ? format(review.createdAt.toDate(), 'd MMM, yyyy', { locale: es }) : 'Reciente'}
                  </div>
              </div>
            </div>
            
            {review.comment && (
              <p className="text-sm text-foreground/70 font-medium italic leading-relaxed pl-4 border-l-2 border-primary/20 bg-primary/[0.02] py-2 rounded-r-xl">
                "{review.comment}"
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

