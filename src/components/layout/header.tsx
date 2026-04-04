'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, LogOut, LayoutGrid, LogIn, Heart, ChevronDown, ChevronRight, Crown, ShieldCheck, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthService, useUser, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn, hasRequiredRole } from '@/lib/utils';
import { CommerceSelector } from './commerce-selector';
import { BrandSkeleton } from '@/components/ui/brand-skeleton';
import NotificationBell from '@/components/layout/notification-bell';
import { haptic } from '@/lib/haptics';
import { motion } from 'framer-motion';
import { navConfig } from '@/config/nav-menu';
import { MagneticButton } from '../ui/magnetic-button';
import { getAvatarUrl } from '@/lib/utils';
import { AvatarFallbackFachero } from '@/components/profile/avatar-selector';
import { usePlatform } from '@/hooks/use-platform';
import Logo from '@/components/common/Logo';

function UserMenu() {
  const { user, userData, roles, isUserLoading } = useUser(); 
  const auth = useAuthService();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
      window.location.href = '/login'; 
    } catch (error) {
      console.error("Error signing out: ", error);
      haptic.vibrateError();
    }
  };

  if (isUserLoading) {
    return <BrandSkeleton className="h-9 w-9 rounded-full" />;
  }

  if (!user) {
    return (
      <Button asChild variant="ghost" size="icon" className="hover:bg-white/10" aria-label="Iniciar Sesión">
        <Link href="/login">
            <LogIn className="h-6 w-6 text-white" />
        </Link>
      </Button>
    );
  }

  const avatarUrl = getAvatarUrl(userData?.avatarSeed);

  return (
    <div className="flex items-center gap-2">
        <DropdownMenu>
            <MagneticButton>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 overflow-hidden" aria-label="User Menu">
                    <Avatar className="h-9 w-9 bg-background border border-white/20">
                        {avatarUrl ? (
                            <AvatarImage src={avatarUrl} alt={user.displayName || 'User'} className="object-cover" />
                        ) : (
                            <AvatarFallbackFachero className="w-full h-full text-lg" />
                        )}
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            </MagneticButton>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.displayName || 'Estudiante'}</p>
                <p className="text-xs leading-none text-foreground">{user.email}</p>
            </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { haptic.vibrateSubtle(); router.push('/favorites'); }}>
            <Heart className="mr-2 h-4 w-4" />
            <span>Mis Favoritos</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { haptic.vibrateSubtle(); router.push('/profile'); }}>
            <User className="mr-2 h-4 w-4" />
            <span>Mi Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { haptic.vibrateImpact(); handleSignOut(); }}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar sesión</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
}

function AppSidebar() {
    const { roles, supplierData } = useUser();
    const allRoles = ['user', ...roles];
    const pathname = usePathname();
    const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

    const toggleGroup = (group: string) => {
        haptic.vibrateSubtle();
        setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    return (
        <Sheet>
            <MagneticButton>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="group hover:bg-white/10" onClick={() => haptic.vibrateSubtle()} aria-label="Open menu">
                        <LayoutGrid className="h-6 w-6 text-white transition-colors" />
                    </Button>
                </SheetTrigger>
            </MagneticButton>
            <SheetContent side="left" className="flex flex-col p-0 w-[300px] bg-white border-r border-black/5 overflow-hidden">
                <SheetHeader className="p-10 border-b border-black/5 relative bg-primary flex items-center justify-center">
                    <Logo 
                        variant="white"
                        className="h-10 w-auto"
                    />
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto py-8 px-4 scrollbar-premium bg-white">
                    <nav className="flex flex-col gap-6">
                        {navConfig.sidebarNav.filter(section => hasRequiredRole(allRoles, section.role)).map(section => (
                            <div key={section.title} className="space-y-4 mb-2">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] font-montserrat text-black/40 px-5 italic">
                                    {section.title}
                                </h3>
                                <div className="grid gap-1.5 px-1">
                                    {section.items?.map(item => {
                                        const Icon = item.icon;
                                        const isCurrent = pathname === item.href;
                                        return (
                                            <SheetClose asChild key={item.href}>
                                                <Link href={item.href}>
                                                    <Button 
                                                        variant="ghost" 
                                                        className={cn(
                                                            "w-full justify-start text-[11px] font-black uppercase tracking-widest h-14 rounded-2xl transition-all",
                                                            isCurrent ? "bg-primary text-white" : "text-black/60 hover:bg-primary/10 hover:text-primary"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "mr-4 p-2 rounded-xl transition-all",
                                                            isCurrent ? "bg-white text-primary" : "bg-primary/10 text-primary border-2 border-primary"
                                                        )}>
                                                            {Icon && <Icon className="h-3.5 w-3.5" />}
                                                        </div>
                                                        {item.title}
                                                    </Button>
                                                </Link>
                                            </SheetClose>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}

                        {Array.from(new Set(navConfig.mainNav.map(i => i.category || 'Otros'))).map((category) => {
                            const visibleItems = navConfig.mainNav.filter(i => (i.category || 'Otros') === category && hasRequiredRole(allRoles, i.role));
                            if (visibleItems.length === 0) return null;
                            const isCollapsed = collapsedGroups[category];

                            return (
                                <div key={category} className="space-y-3">
                                    <button onClick={() => toggleGroup(category)} className="w-full flex items-center justify-between px-5 font-montserrat uppercase font-black text-[9px] text-black/40">
                                        {category}
                                        {isCollapsed ? <ChevronRight className="h-3 w-3 text-black/40" /> : <ChevronDown className="h-3 w-3 text-black/40" />}
                                    </button>
                                    {!isCollapsed && (
                                        <div className="grid gap-1.5">
                                            {visibleItems.map((item) => (
                                                <SheetClose asChild key={item.href}>
                                                    <Link href={item.href}>
                                                        <Button variant="ghost" className={cn("w-full justify-start text-[12px] h-14 rounded-2xl font-black uppercase tracking-widest", pathname === item.href ? "bg-primary text-white" : "text-black/60 hover:bg-primary/5 hover:text-primary")}>
                                                            <div className={cn("mr-4 p-2.5 rounded-xl border-2", pathname === item.href ? "bg-white text-primary border-white" : "bg-white text-primary border-primary")}>
                                                                {item.icon && <item.icon className="h-4 w-4" />}
                                                            </div>
                                                            {item.title}
                                                        </Button>
                                                    </Link>
                                                </SheetClose>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default function Header() {
  const { user, isUserLoading } = useUser();
  const { isMobile } = usePlatform();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full h-[70px] pt-safe flex items-center transition-all duration-500 bg-[#cb465a]/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
      <div className="container relative flex justify-between items-center px-6">
        <div className="flex items-center gap-1">
          <AppSidebar />
          <Button variant="ghost" size="icon" className="hover:bg-white/10 h-10 w-10">
             <Search className="h-5 w-5 text-white" />
          </Button>
        </div>

        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <Logo 
                variant="white"
                className="h-8 w-auto transition-transform hover:scale-105 active:scale-95"
            />
        </Link>

        <div className="flex items-center gap-2">
          {!isUserLoading && user && <NotificationBell />}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

