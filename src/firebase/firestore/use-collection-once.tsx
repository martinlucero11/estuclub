'use client';
import { useEffect, useState } from 'react';
import { getDocs, Query, FirestoreError } from 'firebase/firestore';
import { DocumentData } from '@firebase/firestore';

export interface UseCollectionOnceOptions {
  // Future options
}

/**
 * Serialize a Firestore Query to a stable string key.
 */
function serializeQuery(query: Query | null): string {
  if (!query) return '__null__';
  try {
    const q = (query as any)._query;
    if (q) {
      return JSON.stringify({
        path: q.path?.toString?.() || '',
        filters: q.filters?.map?.((f: any) => `${f.field?.toString?.()}_${f.op}_${JSON.stringify(f.value)}`) || [],
        orderBy: q.explicitOrderBy?.map?.((o: any) => `${o.field?.toString?.()}_${o.dir}`) || [],
        limit: q.limit,
      });
    }
    return '__query_' + (query as any).type;
  } catch {
    return '__query_fallback__';
  }
}

export function useCollectionOnce<T extends DocumentData>(
  query: Query<T> | null,
  options?: UseCollectionOnceOptions
) {
  const [data, setData] = useState<T[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | undefined>(undefined);

  const queryKey = serializeQuery(query);

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
  }, [queryKey]);

  return { data, isLoading, error };
}
