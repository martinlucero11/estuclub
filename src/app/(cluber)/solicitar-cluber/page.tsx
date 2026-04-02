'use client';

export const dynamic = 'force-dynamic';


import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/layout/splash-screen';

export default function SolicitarCluberPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/signup?role=cluber');
    }, [router]);

    return <SplashScreen />;
}
