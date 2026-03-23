import { useMemo } from 'react';
import { useUser, useFirestore, useCollectionOnce } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';

export function useCincoDosStatus() {
    const { user } = useUser();
    const firestore = useFirestore();
    
    const q = useMemo(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'comedor_applications'),
            where('userId', '==', user.uid),
            where('status', '==', 'approved'),
            limit(1)
        );
    }, [user, firestore]);
    
    const { data: rawData, isLoading } = useCollectionOnce(q);
    
    return {
        isApproved: !!(rawData && rawData.length > 0),
        isLoading: isLoading || (user !== null && rawData === undefined)
    };
}
