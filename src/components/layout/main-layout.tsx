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

export default function MainLayout({ children }: { children: React.ReactNode }) {

    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const { isMobile, isWeb } = usePlatform();

    // Check for upcoming appointments and show reminders
    useAppointmentReminders();
    
    useEffect(() => {
        setIsMounted(true);
        // Request FCM permissions on load
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
                        "flex-1 w-full z-0",
                        isMobile ? "pb-24" : "pb-20"
                    )}
                >
                    {children}
                </motion.main>
            </AnimatePresence>
            
            {isWeb && (
                <footer className="w-full text-center py-10 pb-32 text-xs text-muted-foreground/60 z-10">
                    <div className="flex justify-center gap-6 flex-wrap px-4 font-medium uppercase tracking-widest text-[10px]">
                        <a href="/politica-de-privacidad" className="hover:text-primary transition-colors">Privacidad</a>
                        <span>•</span>
                        <a href="/seguridad-infantil" className="hover:text-primary transition-colors">Seguridad</a>
                    </div>
                    <p className="mt-4 opacity-40 font-bold tracking-tighter italic uppercase text-xs">
                        © {new Date().getFullYear()} EstuClub. <span className="text-primary tracking-normal not-italic font-medium opacity-100">Mismo Boutique Creativa</span>
                    </p>
                </footer>
            )}

            <BottomNav />
        </div>
    );
}
