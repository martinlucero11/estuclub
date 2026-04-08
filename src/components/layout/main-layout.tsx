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
import { useAdmin } from '@/context/admin-context';
import { LogOut } from 'lucide-react';

const MeshBackground = dynamic(() => import('@/components/layout/mesh-background'), { ssr: false });

import Footer from '@/components/layout/footer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const { user } = useUser();
    const firestore = useFirestore();
    const { impersonatedUserId, impersonatedSupplierId, setImpersonatedUserId, setImpersonatedSupplierId } = useAdmin();
    
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

    const isDashboard = pathname.startsWith('/panel-cluber') || pathname.startsWith('/admin');

    if (!isMounted) return null;

    return (
        <div className="min-h-screen flex flex-col relative selection:bg-primary/10 bg-background">
            <OfflineWarmer />
            <MeshBackground />
            
            <AnimatePresence mode="wait">
                <motion.main 
                    key={pathname}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ 
                        duration: 0.4, 
                        ease: [0.22, 1, 0.36, 1],
                    }}
                    className={cn(
                        "flex-1 w-full z-0 px-0",
                        isDashboard ? "pt-0 pb-20" : "pt-20 pb-20 md:pt-24 md:pb-24"
                    )}
                >
                    <div className="w-full max-w-7xl mx-auto px-4 md:px-0">
                        {children}
                    </div>
                </motion.main>
            </AnimatePresence>

            {(impersonatedUserId || impersonatedSupplierId) && (
                <button
                    onClick={() => {
                        setImpersonatedUserId(null);
                        setImpersonatedSupplierId(null);
                        window.location.reload();
                    }}
                    className="fixed bottom-20 right-4 z-[9999] bg-black text-white px-4 py-2 rounded-full font-bold shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                >
                    <LogOut className="h-4 w-4 text-red-500" />
                    🛑 Salir de Simulación
                </button>
            )}
        </div>
    );
}
