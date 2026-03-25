'use client';

import { useState, useEffect } from 'react';
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

  const favoriteField = type === 'benefit' ? 'favoriteBenefits' : 'favoriteSuppliers';
  const currentFavorites = (userData as any)?.[favoriteField] || [];
  const isFavorite = currentFavorites.includes(id);

  // Optimistic UI state
  const [optimisticFavorite, setOptimisticFavorite] = useState(isFavorite);
  const [isChanging, setIsChanging] = useState(false);

  // Sync optimistic state with actual state when actual state changes
  useEffect(() => {
    // Only sync if we're not currently in the middle of a manual change
    // or if the value is different from what we'd expect
    if (!isChanging) {
      setOptimisticFavorite(isFavorite);
    }
  }, [isFavorite, isChanging]);

  if (!user || isUserLoading) return null;

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Debes iniciar sesión para guardar favoritos');
      return;
    }

    // Trigger immediate response
    const nextValue = !optimisticFavorite;
    setOptimisticFavorite(nextValue);
    setIsChanging(true);
    
    // Quick haptic
    haptic.vibrateSubtle();
    
    try {
      const userRef = doc(firestore, 'users', user.uid);
      
      // We use the local 'nextValue' to decide operation
      await updateDoc(userRef, {
        [favoriteField]: nextValue ? arrayUnion(id) : arrayRemove(id)
      });
      
      // Update target counter
      const targetRef = doc(firestore, type === 'benefit' ? 'benefits' : 'roles_supplier', id);
      await updateDoc(targetRef, {
        favoritesCount: increment(nextValue ? 1 : -1)
      });

      if (nextValue) {
        haptic.vibrateSuccess();
        triggerSuccessEffect();
        toast.success('¡Agregado a favoritos!');
      } else {
        toast.info('Eliminado de favoritos');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Rollback on error
      setOptimisticFavorite(!nextValue);
      toast.error('Error al actualizar favoritos');
      haptic.vibrateError();
    } finally {
      // Re-enable sync after a short delay to allow data fetch to settle
      setTimeout(() => setIsChanging(false), 2000);
    }
  };

  const isSupplier = type === 'supplier';

  return (
    <motion.button
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleFavorite}
      className={cn(
        "flex items-center justify-center transition-all duration-200", 
        isSupplier 
          ? "h-14 w-14 rounded-2xl glass glass-dark shadow-premium border-2 border-primary/10 active:border-primary/50" 
          : "p-2.5 rounded-full backdrop-blur-md bg-white/20 border border-white/20 shadow-lg",
        optimisticFavorite 
          ? "bg-pink-500/20 text-pink-500 border-pink-500/30" 
          : "text-white hover:bg-white/30",
        className
      )}
      aria-label={optimisticFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <Heart className={cn(
        "h-6 w-6 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]", 
        optimisticFavorite ? "fill-current scale-110 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]" : "scale-100 opacity-80"
      )} />
    </motion.button>
  );
}
