'use client';

import { useEffect, useMemo } from 'react';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';

/**
 * OfflineWarmer is a silent component that subscribes to critical collections 
 * when the app loads. This ensures that even if the user hasn't visited 
 * specific sections yet, the data is already in the local Firestore cache 
 * for offline use.
 */
export default function OfflineWarmer() {
  const firestore = useFirestore();

  // 1. Warm up Benefits (Featured/Recent)
  const benefitsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'benefits'),
      where('isVisible', '==', true),
      limit(50) // Cache a reasonable amount of benefits
    );
  }, [firestore]);

  // 2. Warm up Suppliers
  const suppliersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'roles_supplier'),
      where('isVisible', '==', true)
    );
  }, [firestore]);

  // 3. Warm up Announcements
  const announcementsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
  }, [firestore]);

  // Use the hooks to trigger the subscriptions
  // We don't need the data here, the hooks handle the onSnapshot internally
  useCollection(benefitsQuery);
  useCollection(suppliersQuery);
  useCollection(announcementsQuery);

  // This component renders nothing
  return null;
}
