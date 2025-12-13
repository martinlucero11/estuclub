
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, orderBy, startAfter, limit } from 'firebase/firestore';

/**
 * Custom hook to efficiently calculate a user's rank based on their points.
 * Instead of fetching all users, it fetches only users with more points.
 *
 * @param userId The ID of the user whose rank is to be determined.
 * @param userPoints The current points of the user.
 * @returns An object containing the user's rank and a loading state.
 */
export function useUserRank(userId?: string, userPoints?: number) {
  const [rank, setRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    // Only run if we have the necessary user information.
    if (!userId || typeof userPoints === 'undefined') {
      setRank(null);
      return;
    }

    const calculateRank = async () => {
      setIsLoading(true);
      try {
        const usersRef = collection(firestore, 'users');
        
        // Create a query to find all users with more points than the current user.
        const q = query(
          usersRef,
          where('points', '>', userPoints),
          orderBy('points', 'desc') // Order by points to count them.
        );
        
        const querySnapshot = await getDocs(q);
        
        // The rank is the number of users with more points, plus one.
        const usersWithMorePoints = querySnapshot.size;
        setRank(usersWithMorePoints + 1);

      } catch (error) {
        console.error("Error calculating user rank:", error);
        setRank(null); // Reset rank on error
      } finally {
        setIsLoading(false);
      }
    };

    calculateRank();
  }, [userId, userPoints, firestore]);

  return { rank, isLoading };
}
