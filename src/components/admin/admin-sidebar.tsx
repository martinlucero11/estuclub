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

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Comercios', icon: Store, href: '/admin/clubers' },
  { label: 'Riders', icon: Truck, href: '/admin/riders' },
  { label: 'Marketing', icon: Megaphone, href: '/admin/cms' },
  { label: 'Usuarios', icon: Users, href: '/admin/users' },
  { label: 'Métricas', icon: BarChart3, href: '/admin/analytics' },
  { label: 'Ajustes', icon: Settings, href: '/admin/settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { impersonatedUserId, setImpersonatedUserId } = useAdmin();

  return (
    <div 
      className={cn(
        "relative flex flex-col bg-card border-r border-white/5 transition-all duration-300 z-50 h-screen sticky top-0",
        isCollapsed ? "w-[80px]" : "w-[280px]"
      )}
    >
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3 animate-in fade-in duration-500">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="h-6 w-6 text-white fill-white" />
            </div>
            <div>
                <p className="font-black tracking-tighter text-xl uppercase italic">ESTU<span className="text-primary">ADMIN</span></p>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Overlord v2.2</p>
            </div>
          </div>
        )}
        {isCollapsed && (
            <div className="h-10 w-10 mx-auto rounded-xl bg-primary flex items-center justify-center">
                <Zap className="h-6 w-6 text-white fill-white" />
            </div>
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
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link key={item.label} href={item.href}>
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
            </Link>
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
    </div>
  );
}

