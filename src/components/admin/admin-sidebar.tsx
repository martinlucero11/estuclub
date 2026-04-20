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
  Sparkles,
  BarChart3,
  Ticket,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/context/admin-context';
import Logo from '@/components/common/Logo';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { haptic } from '@/lib/haptics';

const navItems = [
  { label: 'Consola', icon: LayoutDashboard, href: '/admin' },
  { label: 'Home Builder', icon: Zap, href: '/admin/home-builder' },
  { label: 'Gestión CMS', icon: Megaphone, href: '/admin/cms' },
  { label: 'Solicitudes', icon: ShieldCheck, href: '/verify' },
  { label: 'Comercios', icon: Store, href: '/admin/clubers' },
  { label: 'Riders', icon: Truck, href: '/admin/riders' },
  { label: 'Usuarios', icon: Users, href: '/admin/users' },
  { label: 'Métricas', icon: BarChart3, href: '/admin/analytics' },
  { label: 'Cupones', icon: Ticket, href: '/admin/coupons' },
  { label: 'Moderación', icon: CheckCircle2, href: '/dashboard/approve-announcements' },
  { label: 'Master Seed', icon: Sparkles, href: '/admin/seed' },
  { label: 'Ajustes', icon: Settings, href: '#', isGhost: true },
];

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { impersonatedUserId, setImpersonatedUserId } = useAdmin();

  return (
    <div 
      className={cn(
        "flex flex-col bg-white border-r border-zinc-100 transition-all duration-300 z-50 sticky top-0 h-screen",
        isCollapsed ? "w-[80px]" : "w-[260px]",
        className
      )}
    >
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex flex-col gap-1 animate-in fade-in duration-500">
            <Logo variant="rosa" className="h-[68px] w-auto" />
            <div className="flex items-center gap-1.5 px-1">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-900">Admin Central</span>
            </div>
          </div>
        )}
        {isCollapsed && (
             <Logo variant="rosa" className="h-7 w-auto mx-auto" />
        )}
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => { haptic.vibrateSubtle(); setIsCollapsed(!isCollapsed); }}
        className="absolute -right-4 top-20 h-8 w-8 rounded-full bg-white border border-zinc-100 shadow-lg z-50 hover:bg-zinc-50 transition-transform active:scale-90"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Nav Items */}
      <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && item.href !== '#' && pathname.startsWith(item.href));
          
          const NavWrapper = ({ children }: { children: React.ReactNode }) => {
            if (item.href === '#') {
              return (
                <button 
                  onClick={() => { haptic.vibrateNormal(); }}
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
                  "flex items-center gap-4 px-4 h-12 rounded-2xl transition-all duration-300 group relative",
                  isActive 
                    ? "bg-zinc-900 text-white shadow-xl shadow-zinc-200" 
                    : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                {!isCollapsed && (
                  <span className="font-black text-[10px] uppercase tracking-widest">
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

      {/* Footer Area */}
      <div className="p-4 border-t border-zinc-50 mt-auto space-y-2">
          {impersonatedUserId && (
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                       <ShieldCheck className="h-4 w-4 text-orange-500" />
                       <span className="text-[9px] font-black uppercase text-orange-500 tracking-tighter">Simulación</span>
                  </div>
                  {!isCollapsed && (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="w-full h-8 rounded-xl font-black text-[9px] uppercase tracking-widest"
                        onClick={() => {
                            setImpersonatedUserId(null);
                            window.location.href = '/admin';
                        }}
                      >
                        Desactivar
                      </Button>
                  )}
              </div>
          )}

          <Button 
            variant="ghost" 
            onClick={async () => {
                haptic.vibrateSubtle();
                await signOut(auth);
                window.location.href = '/login';
            }}
            className={cn(
                "w-full rounded-2xl transition-all duration-200 flex items-center text-zinc-400 hover:bg-red-50 hover:text-red-500",
                isCollapsed ? "justify-center px-0 h-10" : "justify-start gap-4 px-4 h-10"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && (
                <span className="font-black text-[9px] uppercase tracking-widest">
                    Salir del Panel
                </span>
            )}
          </Button>
      </div>
    </div>
  );
}

