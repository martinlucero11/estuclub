'use client';
import { useEffect, useState } from 'react';
import { getDocs, Query, FirestoreError } from 'firebase/firestore';
import { DocumentData } from '@firebase/firestore';

export interface UseCollectionOnceOptions {
  // Future options
}

export function useCollectionOnce<T extends DocumentData>(
  query: Query<T> | null,
  options?: UseCollectionOnceOptions
) {
  const [data, setData] = useState<T[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | undefined>(undefined);

  useEffect(() => {
    if (!query) {
      setData([]);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    getDocs(query)
      .then((snapshot) => {
        if (!isCancelled) {
          const docs = snapshot.docs.map((doc) => ({
            ...(doc.data() as T),
            id: doc.id,
          }));
          setData(docs);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error("Error in useCollectionOnce:", err);
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [query]);

  return { data, isLoading, error };
}
