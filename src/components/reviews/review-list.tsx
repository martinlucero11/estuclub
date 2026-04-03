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
  rating: number;
  comment: string;
  createdAt: any;
  benefitId: string;
}

export function ReviewList({ supplierId }: { supplierId: string }) {
  const firestore = useFirestore();

  const reviewsQuery = useMemo(() => {
    return query(
      collection(firestore, 'reviews').withConverter(createConverter<Review>()),
      where('supplierId', '==', supplierId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  }, [firestore, supplierId]);

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
      <div className="text-center py-12 bg-background/20 rounded-3xl border-2 border-dashed flex flex-col items-center">
        <MessageSquare className="h-10 w-10 text-foreground/30 mb-2" />
        <p className="text-foreground font-medium">Aún no hay reseñas para este Cluber.</p>
        <p className="text-xs text-foreground mt-1">¡Sé el primero en calificar un beneficio!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="p-5 rounded-2xl border bg-card shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border shadow-sm">
                <AvatarImage src={review.userPhoto} alt={review.userName} />
                <AvatarFallback className="font-bold">{getInitials(review.userName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-bold text-foreground">{review.userName}</p>
                <StarRating rating={review.rating} readonly size="sm" className="mt-0.5" />
              </div>
            </div>
            <div className="text-right">
                <div className="flex items-center gap-1 text-[10px] text-foreground font-medium uppercase tracking-wider">
                    <Calendar className="h-3 w-3" />
                    {review.createdAt?.toDate ? format(review.createdAt.toDate(), 'd MMM, yyyy', { locale: es }) : 'Reciente'}
                </div>
            </div>
          </div>
          
          {review.comment && (
            <p className="text-sm text-foreground/90 italic leading-relaxed pl-1 border-l-2 border-primary/20">
              "{review.comment}"
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

