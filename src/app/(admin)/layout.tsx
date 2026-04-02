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

  if (isUserLoading) return null;
  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#050505] selection:bg-primary/20">
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        {/* Continuous Background Accents */}
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        
        <header className="h-16 border-b border-white/5 bg-background/50 backdrop-blur-xl flex items-center px-8 justify-between z-40 sticky top-0">
           <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">System Operational</p>
           </div>
           {/* Add user menu or quick actions here if needed */}
        </header>

        <div className="flex-1 p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
