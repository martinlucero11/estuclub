'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { haptic } from '@/lib/haptics';
import { triggerSuccessEffect } from '../ui/success-animation';
import { motion } from 'framer-motion';

interface FavoriteButtonProps {
  id: string;
  type: 'benefit' | 'supplier';
  className?: string;
}

export function FavoriteButton({ id, type, className }: FavoriteButtonProps) {
  const { user, userData, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!user || isUserLoading) return null;

  const favoriteField = type === 'benefit' ? 'favoriteBenefits' : 'favoriteSuppliers';
  // Safeguard against missing fields
  const currentFavorites = (userData as any)?.[favoriteField] || [];
  const isFavorite = currentFavorites.includes(id);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Debes iniciar sesión para guardar favoritos');
      return;
    }

    // Trigger subtle haptic on click
    haptic.vibrateSubtle();
    setIsUpdating(true);
    
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        [favoriteField]: isFavorite ? arrayRemove(id) : arrayUnion(id)
      });
      
      // Update target counter
      const targetRef = doc(firestore, type === 'benefit' ? 'benefits' : 'roles_supplier', id);
      await updateDoc(targetRef, {
        favoritesCount: increment(isFavorite ? -1 : 1)
      });

      if (!isFavorite) {
        // Success celebration when added
        haptic.vibrateSuccess();
        triggerSuccessEffect();
        toast.success('¡Agregado a tus favoritos!');
      } else {
        toast.info('Eliminado de favoritos');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Error al actualizar favoritos');
      haptic.vibrateError();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.85 }}
      onClick={toggleFavorite}
      disabled={isUpdating}
      className={cn(
        "p-2.5 rounded-full transition-all duration-300 backdrop-blur-md bg-white/20 hover:bg-white/40 border border-white/20 shadow-lg",
        isFavorite ? "text-pink-500 fill-pink-500 border-pink-500/30 bg-pink-500/10" : "text-white",
        className
      )}
      aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <Heart className={cn(
        "h-5 w-5 transition-transform", 
        isFavorite ? "fill-current scale-110" : "scale-100"
      )} />
    </motion.button>
  );
}
