'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from './star-rating';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReviewFormProps {
  benefitId: string;
  supplierId: string;
  redemptionId: string;
  benefitTitle: string;
  onSuccess?: () => void;
}

export function ReviewForm({ benefitId, supplierId, redemptionId, benefitTitle, onSuccess }: ReviewFormProps) {
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
      // 1. Add review to global reviews collection
      await addDoc(collection(firestore, 'reviews'), {
        benefitId,
        supplierId,
        redemptionId,
        userId: user.uid,
        userName: userData?.firstName ? `${userData.firstName} ${userData.lastName}` : (user.displayName || 'Estudiante'),
        userPhoto: user.photoURL || '',
        rating,
        comment,
        createdAt: serverTimestamp(),
      });

      // 2. Mark redemption as reviewed
      const redemptionRef = doc(firestore, 'benefitRedemptions', redemptionId);
      const userRedemptionRef = doc(firestore, 'users', user.uid, 'redeemed_benefits', redemptionId);
      
      await updateDoc(redemptionRef, { hasReview: true });
      await updateDoc(userRedemptionRef, { hasReview: true });

      toast({
        title: '¡Gracias por tu reseña!',
        description: 'Tu opinión ayuda a otros estudiantes.',
      });
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la reseña. Inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden">
      <CardHeader className="pb-3 bg-primary/10">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            ¿Qué te pareció {benefitTitle}?
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tu calificación</p>
            <StarRating rating={rating} onRatingChange={setRating} size="lg" />
        </div>

        <Textarea 
            placeholder="Cuéntanos tu experiencia (opcional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px] bg-background border-primary/10 focus-visible:ring-primary/20"
        />

        <Button 
            className="w-full font-bold" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
        >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar Reseña'}
        </Button>
      </CardContent>
    </Card>
  );
}
