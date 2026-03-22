'use client';
import { useEffect, useState, useRef } from 'react';
import { onSnapshot, Query } from 'firebase/firestore';
import { DocumentData } from '@firebase/firestore';

export interface UseCollectionOptions {
  // You can add options here if needed in the future
}

/**
 * Serialize a Firestore Query to a stable string key.
 * This prevents listener churn when the query object reference changes
 * but the underlying query is logically identical.
 */
function serializeQuery(query: Query | null): string {
  if (!query) return '__null__';
  try {
    // Use the query's internal representation for stable comparison
    // @ts-ignore - accessing internal _query for serialization
    const q = (query as any)._query;
    if (q) {
      return JSON.stringify({
        path: q.path?.toString?.() || '',
        filters: q.filters?.map?.((f: any) => `${f.field?.toString?.()}_${f.op}_${JSON.stringify(f.value)}`) || [],
        orderBy: q.explicitOrderBy?.map?.((o: any) => `${o.field?.toString?.()}_${o.dir}`) || [],
        limit: q.limit,
        startAt: q.startAt?.position?.map?.((p: any) => JSON.stringify(p)) || [],
        endAt: q.endAt?.position?.map?.((p: any) => JSON.stringify(p)) || [],
      });
    }
    // Fallback: use the firestore path
    return query.type + '_' + JSON.stringify(query);
  } catch {
    // If serialization fails, always return a unique key to force re-subscribe
    return '__fallback_' + Math.random();
  }
}

export function useCollection<T extends DocumentData>(
  query: Query<T> | null,
  options?: UseCollectionOptions
) {
  const [data, setData] = useState<T[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  
  // Track the serialized query key to avoid unnecessary re-subscriptions
  const queryKey = serializeQuery(query);
  const queryRef = useRef<Query<T> | null>(null);
  
  // Only update the stored query when the key actually changes
  if (query !== null) {
    queryRef.current = query;
  }

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
  }, [queryKey]); // Use the serialized key, not the object reference

  return { data, isLoading, error };
}
