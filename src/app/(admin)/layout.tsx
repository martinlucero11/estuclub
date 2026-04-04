'use client';

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { roles, isUserLoading, isAdmin } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.replace('/');
    }
  }, [isUserLoading, isAdmin, router]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">CARGANDO ADMIN...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-white relative overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Continuous Background Accents */}
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        
        <header className="h-16 border-b border-white/5 bg-background/50 backdrop-blur-xl flex items-center px-8 justify-between z-40 sticky top-0 shrink-0">
           <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">SISTEMA ACTIVO</p>
           </div>
        </header>

        <div className="flex-1 p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 relative">
          {children}
        </div>
      </main>
    </div>
  );
}

