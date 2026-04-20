'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useUser, useFirestore } from "@/firebase";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { doc, updateDoc, query, collection, where, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { CluberSidebar } from "@/components/layout/cluber-sidebar";
import { CluberHeader } from "@/components/layout/cluber-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { haptic } from "@/lib/haptics";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/context/admin-context";
import { RoleProvider } from "@/context/role-context";
import { UserRole } from "@/types/data";

export default function CluberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { roles, isUserLoading, userData, supplierData: ownSupplierData, user } = useUser();
  const { isAdmin, impersonatedSupplierId, impersonatedSupplierData } = useAdmin();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Desktop Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Mobile Sidebar State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Section Navigation State (Lifts Panel state to URL)
  const currentSection = useMemo(() => {
    if (pathname.includes('/analytics')) return 'analytics';
    if (pathname.includes('/scanner')) return 'vouchers'; // Scanner is linked to vouchers in sidebar usually
    if (pathname.includes('/supplier-profile')) return 'settings';
    return searchParams.get('section') || 'dashboard';
  }, [pathname, searchParams]);

  // Resolved Data
  const supplierId = (isAdmin && impersonatedSupplierId) ? impersonatedSupplierId : user?.uid;
  const supplierData = (isAdmin && impersonatedSupplierId) ? impersonatedSupplierData : ownSupplierData;
  const cluberName = supplierData?.name || userData?.firstName || 'Mi Local';
  const isPaused = supplierData?.isOpen === false;

  const availableRoles: UserRole[] = roles.filter(
    (role): role is UserRole => ['admin', 'supplier', 'cluber', 'user'].includes(role)
  );

  // Global Audio Alert System
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alertedOrderIds = useRef<Set<string>>(new Set());

  // Check access
  const hasAccess = roles.includes('supplier') || roles.includes('admin') || roles.includes('cluber');

  useEffect(() => {
    if (!isUserLoading && !hasAccess) {
      router.replace('/');
    }
  }, [isUserLoading, hasAccess, router]);

  // Initial audio setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2858/2858-preview.mp3');
      audio.loop = true;
      audioRef.current = audio;
    }
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  // Real-time listener for NEW PENDING orders
  useEffect(() => {
    if (!firestore || !supplierId || !isAudioEnabled) {
        audioRef.current?.pause();
        return;
    }

    const q = query(
      collection(firestore, 'orders'),
      where('supplierId', '==', supplierId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let shouldPlay = false;
      const now = new Date().getTime();

      snapshot.docs.forEach(doc => {
        const orderId = doc.id;
        const createdAt = doc.data().createdAt;
        const orderTime = createdAt instanceof Timestamp ? createdAt.toMillis() : now;

        if (!alertedOrderIds.current.has(orderId) && (now - orderTime < 600000)) {
            shouldPlay = true;
            alertedOrderIds.current.add(orderId);
            haptic.vibrateSuccess();
            toast({
                title: "🔔 NUEVO PEDIDO",
                description: `Has recibido un pedido de ${doc.data().customerName || 'un cliente'}.`,
            });
        }
      });

      const anyPending = snapshot.docs.length > 0;

      if (anyPending && isAudioEnabled) {
          audioRef.current?.play().catch(() => {
              console.warn("Autoplay blocked. User interaction needed.");
          });
      } else {
          audioRef.current?.pause();
          if (audioRef.current) audioRef.current.currentTime = 0;
      }
    });

    return () => unsubscribe();
  }, [firestore, supplierId, isAudioEnabled, toast]);

  const handleTogglePause = async () => {
      if (!firestore || !supplierId) return;
      haptic.vibrateSubtle();
      try {
          const docRef = doc(firestore, 'roles_supplier', supplierId);
          await updateDoc(docRef, { isOpen: isPaused }); 
          toast({
              title: isPaused ? "Local ABIERTO" : "Local CERRADO",
              description: isPaused ? "Los clientes ya pueden realizar pedidos." : "Se han pausado los pedidos temporalmente.",
              variant: isPaused ? "default" : "destructive"
          });
      } catch (error) {
          toast({ title: "Error", description: "No se pudo cambiar el estado.", variant: "destructive" });
      }
  };

  const handleSectionChange = (sectionId: string) => {
    haptic.vibrateSubtle();
    setIsMobileMenuOpen(false);
    
    // Always navigate back to the root panel-cluber when switching sections
    // unless we are specifically going to a standalone route (like scanner)
    if (sectionId === 'scanner') {
        router.push('/panel-cluber/scanner/');
    } else if (sectionId === 'analytics') {
        // Redirigir a la página dedicada de analíticas que es más completa
        router.push('/panel-cluber/analytics/');
    } else {
        router.push(`/panel-cluber/?section=${sectionId}`);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Configurando Panel...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) return null;

  return (
    <RoleProvider availableRoles={availableRoles}>
      <div className="flex min-h-screen bg-[#FDFDFD] selection:bg-rose-500/10">
        {/* Desktop Sidebar */}
        <CluberSidebar 
          currentSection={currentSection}
          onSectionChange={handleSectionChange}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          cluberName={cluberName}
          className="hidden lg:flex"
        />

        {/* Mobile Sidebar (Sheet) */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0 border-none w-[280px]">
            <CluberSidebar 
                currentSection={currentSection}
                onSectionChange={handleSectionChange}
                isCollapsed={false}
                onToggleCollapse={() => setIsMobileMenuOpen(false)}
                className="w-full h-full border-none"
                cluberName={cluberName}
              />
          </SheetContent>
        </Sheet>

        <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
          <CluberHeader 
              onMenuClick={() => setIsMobileMenuOpen(true)}
              isPaused={isPaused}
              onTogglePause={handleTogglePause}
              cluberName={cluberName}
              isAudioEnabled={isAudioEnabled}
              onToggleAudio={() => {
                  haptic.vibrateSubtle();
                  setIsAudioEnabled(!isAudioEnabled);
              }}
          />

          <main className="flex-1 overflow-x-hidden p-4 md:p-8 animate-in fade-in duration-700">
            <div className="max-w-6xl mx-auto h-full">
                {children}
            </div>
          </main>
        </div>

        {/* Mobile Navigation */}
        <BottomNav />
      </div>
    </RoleProvider>
  );
}

