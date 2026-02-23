'use client';
import { useEffect, useState } from 'react';
import { onSnapshot, Query } from 'firebase/firestore';
import { DocumentData } from '@firebase/firestore';

export interface UseCollectionOptions {
  // You can add options here if needed in the future
}

export function useCollection<T extends DocumentData>(
  query: Query<T> | null,
  options?: UseCollectionOptions
) {
  const [data, setData] = useState<T[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    if (!query) {
      setIsLoading(false);
      setData([]); 
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            ...docData,
            id: doc.id,
          } as T;
        });
        setData(docs);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error in useCollection snapshot:", err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]); // The hook is correctly dependent on the query object itself

  return { data, isLoading, error };
}
