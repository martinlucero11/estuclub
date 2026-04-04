'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Store, 
  Truck, 
  Users, 
  Megaphone, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  ShieldCheck,
  Zap,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/context/admin-context';
import Logo from '@/components/common/Logo';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/config';

const navItems = [
  { label: 'Inicio', icon: LayoutDashboard, href: '/admin' },
  { label: 'Solicitudes', icon: ShieldCheck, href: '/verify' },
  { label: 'Comercios', icon: Store, href: '/admin/clubers' },
  { label: 'Riders', icon: Truck, href: '/admin/riders' },
  { label: 'Marketing', icon: Megaphone, href: '/admin/cms' },
  { label: 'Usuarios', icon: Users, href: '/admin/users' },
  { label: 'Métricas', icon: BarChart3, href: '/admin/analytics' },
  { label: 'Ajustes', icon: Settings, href: '#', isGhost: true },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { impersonatedUserId, setImpersonatedUserId } = useAdmin();

  return (
    <div 
      className={cn(
        "flex flex-col bg-card border-r border-white/5 transition-all duration-300 z-50 sticky top-0 h-screen overflow-y-auto",
        isCollapsed ? "w-[80px]" : "w-[280px]"
      )}
    >
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3 animate-in fade-in duration-500">
            <Logo 
                variant="rosa"
                className="h-9 w-auto dark:hidden"
            />
            <Logo 
                variant="white"
                className="h-9 w-auto hidden dark:block"
            />
            <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">ADMIN</span>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">v2.2</span>
            </div>
          </div>
        )}
        {isCollapsed && (
            <Logo 
                variant="rosa"
                className="h-7 w-auto mx-auto dark:hidden"
            />
        )}
        {isCollapsed && (
            <Logo 
                variant="white"
                className="h-7 w-auto mx-auto hidden dark:block"
            />
        )}
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-20 h-8 w-8 rounded-full bg-background border border-white/10 shadow-xl z-50 hover:bg-white/5"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Nav Items */}
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && item.href !== '#' && pathname.startsWith(item.href));
          
          const NavWrapper = ({ children }: { children: React.ReactNode }) => {
            if (item.href === '#') {
              return (
                <button 
                  onClick={() => alert('🚀 Función en desarrollo: ¡Próximamente podrás configurar el sistema!')}
                  className="w-full text-left"
                >
                  {children}
                </button>
              );
            }
            return <Link href={item.href}>{children}</Link>;
          };

          return (
            <NavWrapper key={item.label}>
              <div 
                className={cn(
                  "flex items-center gap-4 px-4 h-12 rounded-2xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "drop-shadow-[0_0_8px_rgba(203, 70, 90,0.5)]")} />
                {!isCollapsed && (
                  <span className="font-black text-[10px] uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">
                    {item.label}
                  </span>
                )}
                {isActive && (
                    <div className="absolute left-0 w-1 h-6 bg-primary rounded-full" />
                )}
              </div>
            </NavWrapper>
          );
        })}
      </nav>

      {/* Impersonation Stop Alert */}
      {impersonatedUserId && (
          <div className="p-4 mx-4 mb-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              {!isCollapsed && (
                  <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-orange-500">SIMULACIÓN ACTIVA</p>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="w-full h-8 rounded-xl font-black text-[9px] uppercase tracking-widest"
                        onClick={() => {
                            setImpersonatedUserId(null);
                            window.location.href = '/admin';
                        }}
                      >
                        DETENER
                      </Button>
                  </div>
              )}
              {isCollapsed && (
                  <Button variant="destructive" size="icon" className="w-full h-10 rounded-xl" onClick={() => { setImpersonatedUserId(null); window.location.href = '/admin'; }}>
                      <LogOut className="h-4 w-4" />
                  </Button>
              )}
          </div>
      )}

      {/* Footer Info */}
      <div className="p-6 border-t border-white/5">
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
           <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center">
             <ShieldCheck className="h-4 w-4 text-emerald-500" />
           </div>
           {!isCollapsed && (
             <div className="overflow-hidden">
               <p className="font-black text-[10px] uppercase truncate">Master Admin</p>
               <p className="text-[8px] text-foreground uppercase tracking-tighter">Acceso Total</p>
             </div>
           )}
        </div>
      </div>

      {/* Logout Button */}
      <div className="p-4 mt-auto mb-2">
          <Button 
            variant="ghost" 
            onClick={async () => {
                await signOut(auth);
                window.location.href = '/login';
            }}
            className={cn(
                "w-full rounded-2xl transition-all duration-200 flex items-center text-red-500 hover:bg-red-500/10 hover:text-red-600",
                isCollapsed ? "justify-center px-0 h-12" : "justify-start gap-4 px-4 h-12"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && (
                <span className="font-black text-[10px] uppercase tracking-widest">
                    Cerrar Sesión
                </span>
            )}
          </Button>
      </div>
    </div>
  );
}

