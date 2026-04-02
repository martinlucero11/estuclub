'use client';

import React, { useEffect, useState, useMemo } from 'react';
import NotificationBell from './notification-bell';
import { cn } from '@/lib/utils';
import { requestNotificationPermission } from '@/lib/fcm';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import { useAppointmentReminders } from '@/hooks/use-appointment-reminders';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { usePlatform } from '@/hooks/use-platform';
import OfflineWarmer from '@/firebase/firestore/offline-warmer';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const MeshBackground = dynamic(() => import('@/components/layout/mesh-background'), { ssr: false });

import Footer from '@/components/layout/footer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const { isMobile, isWeb } = usePlatform();

    // ... exists hooks
    useAppointmentReminders();
    const { user } = useUser();
    const firestore = useFirestore();
    
    useEffect(() => {
        const handleFCM = async () => {
            setIsMounted(true);
            const token = await requestNotificationPermission();
            
            // If we got a token and we have a logged in user, save it
            if (token && user && firestore) {
                try {
                    await updateDoc(doc(firestore, 'users', user.uid), { 
                        fcmToken: token,
                        lastTokenRefresh: new Date()
                    });
                } catch (error) {
                    // Fail silently, token saving is an enhancement
                }
            }
        };
        handleFCM();
    }, [user, firestore]);

    if (!isMounted) return null;

    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/be-cluber' || pathname === '/be-rider';

    return (
        <div className={cn(
            "min-h-[100dvh] flex flex-col relative overflow-x-hidden overscroll-none selection:bg-[#d93b64]/10",
            isAuthPage ? "bg-[#050505]" : "bg-background"
        )}>
            <OfflineWarmer />
            <MeshBackground />
            
            {!isAuthPage && <Header />}
            
            <AnimatePresence mode="wait">
                <motion.main 
                    key={pathname}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ 
                        duration: 0.4, 
                        ease: [0.22, 1, 0.36, 1], // Custom "breathable" ease
                    }}
                    className={cn(
                        "flex-1 w-full z-0 px-0",
                        !isAuthPage && "pt-[70px] pb-[100px]"
                    )}
                >
                    <div className={cn(
                        "w-full h-full", 
                        !isAuthPage ? "max-w-7xl mx-auto px-4 md:px-0" : "mobile-container"
                    )}>
                        {children}
                    </div>
                </motion.main>
            </AnimatePresence>
            
            {isWeb && !isAuthPage && <Footer />}

            {!isAuthPage && <BottomNav />}
        </div>
    );
}
