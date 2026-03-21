'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

      toast.success(isFavorite ? 'Eliminado de favoritos' : 'Agregado a favoritos');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Error al actualizar favoritos');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={isUpdating}
      className={cn(
        "p-2 rounded-full transition-all duration-200 backdrop-blur-md bg-white/20 hover:bg-white/40 border border-white/20",
        isFavorite ? "text-pink-500 fill-pink-500" : "text-white",
        className
      )}
      aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
    </button>
  );
}
