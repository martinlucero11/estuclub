'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, runTransaction, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from './star-rating';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { submitAppointmentReview } from '@/lib/actions/reviews';

interface ReviewFormProps {
  type?: 'benefit' | 'appointment';
  benefitId?: string;
  appointmentId?: string;
  supplierId: string;
  redemptionId?: string;
  title: string;
  onSuccess?: () => void;
}

export function ReviewForm({ 
  type = 'benefit', 
  benefitId, 
  appointmentId, 
  supplierId, 
  redemptionId, 
  title, 
  onSuccess 
}: ReviewFormProps) {
  const { user, userData } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      if (type === 'appointment') {
        if (!appointmentId) throw new Error('Appointment ID missing');
        
        const idToken = await user.getIdToken();

        const res = await submitAppointmentReview({
          appointmentId,
          supplierId,
          userId: user.uid,
          rating,
          comment
        }, idToken);

        if (!res.success) throw new Error(res.error);

      } else {
        // Benefit Review Logic (Legacy/Standalone)
        if (!benefitId || !redemptionId) throw new Error('Benefit or Redemption ID missing');

        // 1. Add review document
        await addDoc(collection(firestore, 'reviews'), {
          benefitId,
          supplierId,
          redemptionId,
          userId: user.uid,
          userName: userData?.firstName ? `${userData.firstName} ${userData.lastName}` : (user.displayName || 'Estudiante'),
          userPhoto: user.photoURL || '',
          rating,
          comment,
          type: 'benefit_review',
          createdAt: serverTimestamp(),
        });

        // 2. Update supplier stats atomically
        const supplierRef = doc(firestore, 'roles_supplier', supplierId);
        await runTransaction(firestore, async (transaction) => {
          const supplierDoc = await transaction.get(supplierRef);
          if (!supplierDoc.exists()) return;

          const supplierData = supplierDoc.data();
          const oldCount = (supplierData.reviewCount as number) || 0;
          const oldAvg = (supplierData.avgRating as number) || 0;
          const newCount = oldCount + 1;
          const newAvg = ((oldAvg * oldCount) + rating) / newCount;

          transaction.update(supplierRef, {
            avgRating: newAvg,
            reviewCount: newCount,
          });
        });

        // 3. Mark redemption as reviewed
        try {
          const redemptionRef = doc(firestore, 'redemptions', redemptionId);
          await updateDoc(redemptionRef, { hasReview: true });
          const userRedemptionRef = doc(firestore, 'users', user.uid, 'redemptions', redemptionId);
          await setDoc(userRedemptionRef, { hasReview: true }, { merge: true });
        } catch (e) {
          console.warn('Could not mark redemption as reviewed:', e);
        }
      }

      toast({
        title: '¡Gracias por tu reseña!',
        description: 'Tu opinión ayuda a otros estudiantes.',
      });
      
      onSuccess?.();
      setRating(5);
      setComment('');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo guardar la reseña. Inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden transition-all duration-500 animate-in zoom-in-95">
      <CardHeader className="pb-3 bg-primary/10">
        <CardTitle className="text-sm font-black italic uppercase tracking-tighter flex items-center gap-2">
            <Star className="h-4 w-4 text-primary fill-primary" />
            ¿Qué te pareció {title}?
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-bold text-foreground uppercase tracking-widest">Tu calificación</p>
              <StarRating rating={rating} onRatingChange={setRating} size="lg" />
          </div>

          <Textarea 
              placeholder="Cuéntanos tu experiencia (opcional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px] bg-background border-primary/10 focus-visible:ring-primary/20"
          />

          <Button 
              type="submit"
              className="w-full font-bold" 
              disabled={isSubmitting}
          >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar Reseña'}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}

