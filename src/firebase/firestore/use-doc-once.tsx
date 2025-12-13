'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  doc,
  getDoc,
  DocumentReference,
  DocumentData,
  FirestoreError,
  Firestore,
} from 'firebase/firestore';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDocOnce hook.
 * @template T Type of the document data.
 */
export interface UseDocOnceResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | null;
}

/**
 * React hook to fetch a single Firestore document once.
 * It does not subscribe to real-time updates.
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} docRef - The Firestore DocumentReference.
 * @returns {UseDocOnceResult<T>} Object with data, isLoading, error.
 */
export function useDocOnce<T = any>(
  docRef: DocumentReference<DocumentData> | null | undefined,
): UseDocOnceResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!docRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData({ ...(docSnap.data() as T), id: docSnap.id });
        } else {
          setData(null);
        }
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [docRef]); // Re-run only if the document reference itself changes.

  return { data, isLoading, error };
}

/**
 * A memoized version of useDocOnce that uses useMemoFirebase internally.
 * This is useful for creating stable document references inside components.
 */
export function useMemoizedDocOnce<T = any>(
  firestore: Firestore | null,
  path: string,
  ...pathSegments: string[]
): UseDocOnceResult<T> {
  const docRef = useMemo(() => {
    if (!firestore || !path) return null;
    try {
      return doc(firestore, path, ...pathSegments) as DocumentReference<DocumentData>;
    } catch (e) {
      console.error("Failed to create document reference:", e);
      return null;
    }
  }, [firestore, path, ...pathSegments]);

  return useDocOnce<T>(docRef);
}
