'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/layout/splash-screen';

export default function SignupChoicePage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/signup');
    }, [router]);

    return <SplashScreen />;
}
