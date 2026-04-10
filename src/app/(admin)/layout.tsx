'use client';

import React, { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { OrderStaleMonitor } from "@/components/admin/order-stale-monitor";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, User, ShieldCheck, ChevronDown, LogOut } from "lucide-react";
import Logo from "@/components/common/Logo";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { haptic } from "@/lib/haptics";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/config";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isUserLoading, userData } = useUser();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.replace('/');
    }
  }, [isUserLoading, isAdmin, router]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Acceso Maestro...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-[#FDFDFD] selection:bg-primary/10">
      <AdminSidebar className="hidden md:flex" />

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 border-none w-[280px]">
           <AdminSidebar className="w-full h-full" /> 
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 md:h-20 border-b border-zinc-100 bg-white/80 backdrop-blur-xl flex items-center px-4 md:px-8 justify-between z-40 sticky top-0 shrink-0">
           <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden h-10 w-10 rounded-xl"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden sm:flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Sistema Activo | Consola Central</p>
              </div>
              <Logo variant="rosa" className="h-6 w-auto md:hidden" />
           </div>

           <div className="flex items-center gap-2 md:gap-4">
               <div className="hidden lg:flex items-center gap-2 px-4 h-10 rounded-2xl bg-zinc-50 border border-zinc-100 italic">
                   <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
                   <span className="text-[10px] font-black uppercase tracking-tight text-zinc-900">Control de Estuclub</span>
               </div>

               <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-10 md:h-12 rounded-2xl border border-zinc-100 hover:bg-zinc-50 flex items-center gap-2 px-2 md:px-3">
                            <div className="h-7 w-7 md:h-8 md:w-8 rounded-xl bg-zinc-900 flex items-center justify-center shadow-lg">
                                <User className="h-4 w-4 text-white" />
                            </div>
                            <ChevronDown className="h-3 w-3 text-zinc-400 hidden sm:block" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-[1.5rem] border-zinc-100 shadow-2xl">
                        <div className="px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Administrador</p>
                            <p className="text-[11px] font-black text-zinc-900 truncate">{userData?.firstName || 'Root'}</p>
                        </div>
                        <DropdownMenuItem 
                            onClick={async () => { haptic.vibrateSubtle(); await signOut(auth); window.location.href = '/login'; }}
                            className="rounded-xl font-bold text-[10px] uppercase py-3 cursor-pointer focus:bg-red-50 text-red-500 gap-3"
                        >
                            <LogOut className="h-4 w-4" /> Cerrar Sesión
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
           </div>
        </header>

        <main className="flex-1 p-4 md:p-8 animate-in fade-in duration-700 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <OrderStaleMonitor />
      </div>
    </div>
  );
}

