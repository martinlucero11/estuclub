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
  
  // Local state for optimistic update
  const favoriteField = type === 'benefit' ? 'favoriteBenefits' : 'favoriteSuppliers';
  const currentFavorites = (userData as any)?.[favoriteField] || [];
  const [localIsFavorite, setLocalIsFavorite] = useState<boolean | null>(null);

  if (!user || isUserLoading) return null;

  // Resolve current state: local state takes priority during interaction
  const isFavorite = localIsFavorite !== null ? localIsFavorite : currentFavorites.includes(id);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Debes iniciar sesión para guardar favoritos');
      return;
    }

    // 1. Optimistic Update
    const newState = !isFavorite;
    setLocalIsFavorite(newState);
    haptic.vibrateSubtle();
    
    // If becoming favorite, play success effect IMMEDIATELY
    if (newState) {
        haptic.vibrateSuccess();
        triggerSuccessEffect();
    }

    setIsUpdating(true);
    
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        [favoriteField]: newState ? arrayUnion(id) : arrayRemove(id)
      });
      
      // Update target counter
      const targetRef = doc(firestore, type === 'benefit' ? 'benefits' : 'roles_supplier', id);
      await updateDoc(targetRef, {
        favoritesCount: increment(newState ? 1 : -1)
      });

      if (newState) {
        toast.success('¡Agregado a tus favoritos!');
      } else {
        toast.info('Eliminado de favoritos');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Rollback on error
      setLocalIsFavorite(!newState);
      toast.error('Error al actualizar favoritos');
      haptic.vibrateError();
    } finally {
      setIsUpdating(false);
      // We don't reset localIsFavorite immediately to avoid "flicker" 
      // while Firestore listener syncs back the new state to userData
      setTimeout(() => setLocalIsFavorite(null), 3000);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.85 }}
      onClick={toggleFavorite}
      disabled={isUpdating}
      className={cn(
        "p-2.5 rounded-full transition-all duration-500 backdrop-blur-md bg-white/20 hover:bg-white/40 border border-white/20 shadow-lg",
        isFavorite ? "text-pink-500 fill-pink-500 border-pink-500/30 bg-pink-500/10" : "text-white",
        className
      )}
      aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <Heart className={cn(
        "h-5 w-5 transition-all duration-500", 
        isFavorite ? "fill-current scale-110 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" : "scale-100"
      )} />
    </motion.button>
  );
}
