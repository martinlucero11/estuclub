'use client';

import React, { useEffect, useState, useMemo } from 'react';
import NotificationBell from './notification-bell';
import { requestNotificationPermission } from '@/lib/fcm';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import { useAppointmentReminders } from '@/hooks/use-appointment-reminders';
import { motion, AnimatePresence, useScroll, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { usePathname } from 'next/navigation';

function MeshBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for mouse tracking
  const springX = useSpring(mouseX, { damping: 25, stiffness: 120 });
  const springY = useSpring(mouseY, { damping: 25, stiffness: 120 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Transform coordinates into subtle movements for blobs
  const blob1X = useTransform(springX, (v) => v * 0.05);
  const blob1Y = useTransform(springY, (v) => v * 0.05);
  const blob2X = useTransform(springX, (v) => (window.innerWidth - v) * 0.03);
  const blob2Y = useTransform(springY, (v) => (window.innerHeight - v) * 0.03);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Mesh Gradients */}
      <div className="absolute inset-0 bg-[#fafafa] dark:bg-[#0a0a0b]" />
      
      {/* Animated Blobs */}
      <motion.div 
        style={{ x: blob1X, y: blob1Y }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] mix-blend-multiply dark:mix-blend-soft-light"
      />
      <motion.div 
        style={{ x: blob2X, y: blob2Y }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] mix-blend-multiply dark:mix-blend-soft-light"
      />
      
      {/* Floating 3D Orbs (Level 3 Depth) */}
      <div className="absolute inset-0 z-0">
         <motion.div 
            className="absolute top-[20%] left-[15%] w-32 h-32 rounded-full bg-primary/20 blur-3xl animate-float-orb"
            style={{ animationDelay: '0s' }}
         />
         <motion.div 
            className="absolute bottom-[30%] right-[10%] w-48 h-48 rounded-full bg-blue-500/10 blur-3xl animate-float-orb"
            style={{ animationDelay: '-3s' }}
         />
         <motion.div 
            className="absolute top-[60%] left-[60%] w-24 h-24 rounded-full bg-pink-500/15 blur-2xl animate-float-orb"
            style={{ animationDelay: '-7s' }}
         />
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-pink-500/5 blur-[100px]" />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" 
           style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    // Check for upcoming appointments and show reminders
    useAppointmentReminders();
    
    useEffect(() => {
        setIsMounted(true);
        // Request FCM permissions on load
        requestNotificationPermission();
    }, []);

    if (!isMounted) return null;

    return (
        <div className="min-h-screen flex flex-col relative">
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
                    className="flex-1 w-full pb-20 z-0"
                >
                    {children}
                </motion.main>
            </AnimatePresence>
            
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

            <BottomNav />
        </div>
    );
}
