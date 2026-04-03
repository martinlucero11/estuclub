'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/layout/splash-screen';

export default function BeRiderPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/signup?role=rider');
    }, [router]);

    return <SplashScreen />;
}

