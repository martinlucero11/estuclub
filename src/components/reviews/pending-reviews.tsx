'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { ReviewForm } from './review-form';
import { createConverter } from '@/lib/firestore-converter';
import type { BenefitRedemption } from '@/types/data';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquarePlus } from 'lucide-react';

export function PendingReviews() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [closedIds, setClosedIds] = useState<string[]>([]);

  const pendingQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'redeemed_benefits').withConverter(createConverter<BenefitRedemption>()),
      orderBy('usedAt', 'desc'),
      limit(20)
    );
  }, [user?.uid, firestore]);

  const { data: redemptions, isLoading } = useCollection(pendingQuery);

  const pendingReview = useMemo(() => {
    if (!redemptions) return null;
    // Find the first one that doesn't have a review, was used, and hasn't been closed in this session
    return redemptions.find(r => r.status === 'used' && !r.hasReview && !closedIds.includes(r.id));
  }, [redemptions, closedIds]);

  if (isLoading) {
      return (
          <div className="my-6 space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
      );
  }
  
  if (!pendingReview) return null;

  return (
    <div className="my-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2 mb-3 text-primary font-bold px-1">
        <MessageSquarePlus className="h-4 w-4" />
        <span className="text-sm uppercase tracking-wider">¡Danos tu opinión!</span>
      </div>
      <ReviewForm 
        key={pendingReview.id}
        redemptionId={pendingReview.id}
        benefitId={pendingReview.benefitId}
        supplierId={pendingReview.supplierId}
        benefitTitle={pendingReview.benefitTitle}
        onSuccess={() => setClosedIds([...closedIds, pendingReview.id])}
      />
    </div>
  );
}
