'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollectionOnce } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';

export type CincoDosStatus = 'none' | 'pending' | 'approved' | 'rejected';

export function useCincoDosStatus() {
    const { user } = useUser();
    const firestore = useFirestore();
    
    const q = useMemo(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'comedor_applications'),
            where('userId', '==', user.uid),
            limit(1)
        );
    }, [user, firestore]);
    
    const { data: rawData, isLoading } = useCollectionOnce(q);
    
    const application = rawData && rawData.length > 0 ? rawData[0] : null;
    const status: CincoDosStatus = application ? (application.status as CincoDosStatus) : 'none';

    return {
        isApproved: status === 'approved',
        status,
        application,
        isLoading: isLoading || (user !== null && rawData === undefined)
    };
}

