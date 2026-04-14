'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Calendar, 
  QrCode, 
  BarChart3, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Megaphone,
  Ticket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Logo from '@/components/common/Logo';
import { haptic } from '@/lib/haptics';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  href?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Monitor Pedidos', icon: LayoutDashboard },
  { id: 'menu', label: 'Menú & Productos', icon: Package },
  { id: 'turnero', label: 'Turnero Estu', icon: Calendar },
  { id: 'benefits', label: 'Beneficios Estu', icon: Ticket },
  { id: 'vouchers', label: 'Canjes QR', icon: QrCode },
  { id: 'marketing', label: 'Anuncios', icon: Megaphone },
  { id: 'analytics', label: 'Estadísticas', icon: BarChart3 },
  { id: 'team', label: 'Mi Equipo', icon: Users },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

interface CluberSidebarProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
  cluberName?: string;
}

export function CluberSidebar({ 
  currentSection, 
  onSectionChange, 
  isCollapsed, 
  onToggleCollapse,
  className,
  cluberName
}: CluberSidebarProps) {
  return (
    <div 
      className={cn(
        "hidden md:flex flex-col bg-white border-r border-zinc-100 transition-all duration-300 z-50 sticky top-0 h-screen",
        isCollapsed ? "w-[80px]" : "w-[260px]",
        className
      )}
    >
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex flex-col gap-1 animate-in fade-in duration-500">
            <Logo brand="default" variant="rosa" className="h-8 w-auto" />
            <div className="flex items-center gap-1.5 px-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Portal Cluber</span>
            </div>
          </div>
        )}
        {isCollapsed && (
             <Logo brand="default" variant="rosa" className="h-7 w-auto mx-auto" />
        )}
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onToggleCollapse}
        className="absolute -right-4 top-20 h-8 w-8 rounded-full bg-white border border-zinc-100 shadow-lg z-50 hover:bg-zinc-50 transition-transform active:scale-90"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Nav Items */}
      <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {navItems.map((item) => {
          const isActive = currentSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 h-12 rounded-2xl transition-all duration-300 group relative",
                isActive 
                  ? "bg-primary/5 text-primary shadow-[0_4px_20px_rgba(203,70,90,0.1)]" 
                  : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110", 
                isActive && "drop-shadow-[0_0_8px_rgba(203,70,90,0.3)]"
              )} />
              {!isCollapsed && (
                <span className="font-black text-[10px] uppercase tracking-widest text-left">
                  {item.label}
                </span>
              )}
              {isActive && (
                  <div className="absolute left-0 w-1 h-6 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile/Footer */}
      <div className="p-4 border-t border-zinc-50 mt-auto">
          {!isCollapsed ? (
              <div className="bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100/50 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-black uppercase text-zinc-900 truncate tracking-tight">{cluberName || 'Cargando...'}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Verificado</span>
                  </div>
              </div>
          ) : (
            <div className="h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center mx-auto text-primary">
                <ShieldCheck className="h-5 w-5" />
            </div>
          )}
      </div>
    </div>
  );
}
