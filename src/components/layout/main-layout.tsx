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

const MeshBackground = dynamic(() => import('@/components/layout/mesh-background'), { ssr: false });

import Footer from '@/components/layout/footer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const { isMobile, isWeb } = usePlatform();

    // ... exists hooks
    useAppointmentReminders();
    
    useEffect(() => {
        setIsMounted(true);
        requestNotificationPermission();
    }, []);

    if (!isMounted) return null;

    return (
        <div className="min-h-screen flex flex-col relative overflow-x-hidden">
            <OfflineWarmer />
            <MeshBackground />
            
            <Header />
            
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
                        "flex-1 w-full z-0 px-4 md:px-0",
                        "pt-24", // Buffer for fixed header
                        "pb-12" // Spacing before footer
                    )}
                >
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </motion.main>
            </AnimatePresence>
            
            {isWeb && <Footer />}

            <BottomNav />
        </div>
    );
}
