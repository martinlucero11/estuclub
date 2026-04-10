'use client';

import React from 'react';
import { 
  Menu, 
  Bell, 
  Search, 
  Phone, 
  ExternalLink, 
  LogOut,
  ChevronDown,
  User,
  Zap,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import Logo from '@/components/common/Logo';
import { haptic } from '@/lib/haptics';

interface CluberHeaderProps {
  onMenuClick: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  cluberName?: string;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
}

export function CluberHeader({ 
  onMenuClick, 
  isPaused, 
  onTogglePause, 
  cluberName,
  isAudioEnabled,
  onToggleAudio 
}: CluberHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-zinc-100 px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
      {/* Left: Mobile Menu & Breadcrumb (Desktop) */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden h-10 w-10 rounded-xl hover:bg-zinc-100"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="hidden md:flex flex-col">
            <h2 className="text-sm font-black uppercase tracking-tight text-zinc-900 group flex items-center gap-2">
                Panel de Control 
                <span className="text-zinc-300 font-medium">/</span>
                <span className="text-primary italic">{cluberName || 'Tu Negocio'}</span>
            </h2>
        </div>

        <Logo brand="default" variant="rosa" className="h-6 w-auto md:hidden" />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Local Status Toggle - EL CORAZÓN DEL PANEL */}
        <div className={cn(
            "flex items-center gap-3 px-3 md:px-4 h-10 md:h-12 rounded-2xl border transition-all duration-500",
            isPaused ? "bg-red-50/50 border-red-100 shadow-sm" : "bg-emerald-50/50 border-emerald-100 shadow-sm"
        )}>
            <div className="hidden sm:flex flex-col items-end">
                <span className={cn("text-[8px] font-black uppercase tracking-widest", isPaused ? "text-red-500" : "text-emerald-500")}>
                    {isPaused ? "Cerrado" : "Abierto"}
                </span>
                <span className="text-[7px] font-bold text-zinc-400 uppercase tracking-tighter">Status Delivery</span>
            </div>
            <Switch 
                checked={!isPaused} 
                onCheckedChange={onTogglePause}
                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500 scale-90 md:scale-100"
            />
        </div>

        {/* Global Sound Alert Toggle */}
        <Button
            variant="ghost"
            size="icon"
            onClick={onToggleAudio}
            className={cn(
                "h-10 w-10 md:h-12 md:w-12 rounded-2xl border transition-all",
                isAudioEnabled 
                    ? "bg-primary/5 border-primary/20 text-primary shadow-inner" 
                    : "bg-zinc-50 border-zinc-100 text-zinc-400"
            )}
        >
            <Bell className={cn("h-4 w-4 md:h-5 md:w-5", isAudioEnabled && "animate-bounce")} />
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 md:h-12 rounded-2xl border border-zinc-100 hover:bg-zinc-50 flex items-center gap-2 px-2 md:px-3">
                    <div className="h-7 w-7 md:h-8 md:w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
                        <User className="h-4 w-4 text-primary" />
                    </div>
                    <ChevronDown className="h-3 w-3 text-zinc-400 hidden sm:block" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-[1.5rem] border-zinc-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Usuario Activo</p>
                    <p className="text-[11px] font-black text-zinc-900 truncate">{cluberName}</p>
                </div>
                <DropdownMenuSeparator className="bg-zinc-50" />
                <DropdownMenuItem className="rounded-xl font-bold text-[10px] uppercase py-3 cursor-pointer focus:bg-zinc-50 gap-3">
                    <User className="h-4 w-4 text-zinc-400" /> Mi Perfil
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl font-bold text-[10px] uppercase py-3 cursor-pointer focus:bg-zinc-50 gap-3">
                    <Zap className="h-4 w-4 text-zinc-400" /> Suscripción
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-50" />
                <DropdownMenuItem 
                    onClick={() => { haptic.vibrateSubtle(); window.location.href = '/login'; }}
                    className="rounded-xl font-bold text-[10px] uppercase py-3 cursor-pointer focus:bg-red-50 text-red-500 gap-3"
                >
                    <LogOut className="h-4 w-4" /> Salir del Panel
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
