'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, LogOut, LayoutGrid, LogIn, Heart, ChevronDown, ChevronRight } from 'lucide-react';
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
import { useAuthService, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn, hasRequiredRole } from '@/lib/utils';
import { BrandSkeleton } from '@/components/ui/brand-skeleton';
import NotificationBell from '@/components/layout/notification-bell';
import { haptic } from '@/lib/haptics';
import { motion } from 'framer-motion';
import { navConfig } from '@/config/nav-menu';
import { SearchBar } from '@/components/layout/search-bar';
import { MagneticButton } from '../ui/magnetic-button';
import { getAvatarUrl } from '@/lib/utils';
import { AvatarFallbackFachero } from '@/components/profile/avatar-selector';
import { usePlatform } from '@/hooks/use-platform';
import { ModeToggle } from './mode-toggle';
import { Suspense } from 'react';

function UserMenu() {
  const { user, userData, roles, isUserLoading } = useUser(); 
  const isSupplier = roles.includes('supplier');
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cerrar la sesión. Por favor, inténtalo de nuevo.",
      });
    }
  };

  if (isUserLoading) {
    return <BrandSkeleton className="h-9 w-9 rounded-full" />;
  }

  if (!user) {
    return (
      <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white" aria-label="Iniciar Sesión">
        <Link href="/login">
            <LogIn className="h-6 w-6" />
            <span className="sr-only">Iniciar Sesión</span>
        </Link>
      </Button>
    );
  }

  const avatarUrl = useMemo(() => {
    if (isSupplier) {
      // Supplier respects useAvatar preference
      if (userData?.useAvatar) return getAvatarUrl(userData?.avatarSeed);
      return user?.photoURL || userData?.photoURL;
    }
    return getAvatarUrl(userData?.avatarSeed);
  }, [user?.photoURL, userData?.avatarSeed, userData?.photoURL, userData?.useAvatar, isSupplier]);

  return (
    <DropdownMenu>
        <MagneticButton>
          <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20 overflow-hidden" aria-label="Menú de usuario">
                  <Avatar className="h-9 w-9 bg-background">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={user.displayName || 'Avatar de usuario'} className="object-cover" />
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
            <p className="text-sm font-medium leading-none">
              {user.displayName || 'Estudiante'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
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
  );
}

function AppSidebar() {
    const { roles, supplierData } = useUser();
    const allRoles = ['user', ...roles];
    const pathname = usePathname();
    const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>(() => {
        if (typeof window === 'undefined') return {};
        const saved = localStorage.getItem('sidebar-collapsed-groups');
        return saved ? JSON.parse(saved) : {};
    });

    const toggleGroup = (group: string) => {
        haptic.vibrateSubtle();
        const newCollapsed = { ...collapsedGroups, [group]: !collapsedGroups[group] };
        setCollapsedGroups(newCollapsed);
        localStorage.setItem('sidebar-collapsed-groups', JSON.stringify(newCollapsed));
    };

    return (
        <Sheet>
            <MagneticButton>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="group hover:bg-white/20" onClick={() => haptic.vibrateSubtle()} aria-label="Abrir menú principal">
                        <LayoutGrid className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                        <span className="sr-only">Abrir menú</span>
                    </Button>
                </SheetTrigger>
            </MagneticButton>
            <SheetContent side="left" className="flex flex-col p-0 w-[320px] glass-sidebar border-r-0 overflow-hidden">
                <SheetHeader className="p-8 border-b border-border/20 relative">
                    <div className="flex justify-center mb-4 mt-2">
                        <div className="relative">
                           <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-50" />
                           <div
                               className="relative z-10 h-10 w-[140px] bg-primary [mask-image:url(/logo.svg)] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]"
                               aria-label="EstuClub Logo"
                           />
                        </div>
                    </div>
                    <SheetTitle className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">
                        Plataforma Estudiantil
                    </SheetTitle>
                    <SheetDescription className="sr-only">Menú principal de navegación</SheetDescription>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto py-6 px-4 scrollbar-premium pr-2">
                    <nav className="flex flex-col gap-4">
                        {Array.from(new Set(navConfig.mainNav.map(i => i.category || 'Otros'))).map((category) => {
                            const categoryItems = navConfig.mainNav.filter(i => (i.category || 'Otros') === category);
                            const visibleItems = categoryItems.filter(item => {
                                const roleMatch = hasRequiredRole(allRoles, item.role);
                                if (!roleMatch) return false;
                                
                                // Check for supplier capabilities (e.g., deliveryEnabled)
                                if (item.supplierCapability && (!supplierData || !supplierData[item.supplierCapability])) {
                                    return false;
                                }
                                
                                return true;
                            });
                            
                            if (visibleItems.length === 0) return null;
                            const isCollapsed = collapsedGroups[category];

                            return (
                                <div key={category} className="space-y-2">
                                    <button 
                                        onClick={() => toggleGroup(category)}
                                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/5 rounded-xl transition-colors group/header"
                                    >
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 group-hover/header:text-primary transition-colors">
                                            {category}
                                        </h3>
                                        {isCollapsed ? (
                                            <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover/header:text-primary transition-colors" />
                                        ) : (
                                            <ChevronDown className="h-3 w-3 text-muted-foreground/30 group-hover/header:text-primary transition-colors" />
                                        )}
                                    </button>
                                    
                                    <div className={cn(
                                        "flex flex-col gap-1 overflow-hidden transition-all duration-300",
                                        isCollapsed ? "max-h-0 opacity-0" : "max-h-[1000px] opacity-100"
                                    )}>
                                        {visibleItems.map((item) => {
                                            const Icon = item.icon;
                                            const isActive = pathname === item.href;
                                            
                                            return (
                                                <SheetClose asChild key={item.href}>
                                                    <Link href={item.href}>
                                                        <Button 
                                                            variant="ghost" 
                                                            className={cn(
                                                                "w-full justify-start text-sm py-5 h-auto transition-all duration-300 group rounded-2xl relative",
                                                                isActive ? "bg-primary/10 text-primary" : "hover:bg-white/5 opacity-70 hover:opacity-100"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "mr-3 p-2 rounded-xl transition-all duration-300",
                                                                isActive ? "bg-primary text-white shadow-lg shadow-primary/25" : "bg-white/5 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                                            )}>
                                                                {Icon && <Icon className="h-4 w-4" />}
                                                            </div>
                                                            <span className="font-bold tracking-tight">{item.title}</span>
                                                            
                                                            {isActive && (
                                                                <motion.div 
                                                                    layoutId="active-pill"
                                                                    className="absolute right-4 w-1 h-1 rounded-full bg-primary shadow-[0_0_10px_rgba(236,72,153,0.8)]"
                                                                />
                                                            )}
                                                        </Button>
                                                    </Link>
                                                </SheetClose>
                                            )
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-8 mt-auto pb-8">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary/40">
                        <span>Con amor para Mela {"<3"}</span>
                        <span>Estuclub - 2026</span>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default function Header() {
  const { user, isUserLoading } = useUser();
  const { isMobile, isWeb } = usePlatform();

  return (
    <>
    <header 
      className={cn(
        "sticky top-0 z-40 w-full shadow-premium transition-all duration-300 pt-safe header-mesh overflow-hidden",
        isMobile ? "min-h-[80px]" : "min-h-[70px]"
      )}
    >
      <div className="absolute inset-0 glass-header z-[-1]" />
      <div className={cn(
        "container relative flex h-full justify-between px-4 items-center h-full py-4",
      )}>
        {/* Left Slot: Actions */}
        <div className="flex items-center">
          <AppSidebar />
        </div>

        {/* Center Slot: Positioned Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 mt-1">
            <Link href="/" aria-label="Homepage">
                <Image 
                    src="/logo.svg" 
                    alt="EstuClub Logo" 
                    width={110} 
                    height={28} 
                    priority
                    className="h-7 sm:h-8 brightness-110 drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]"
                    style={{ width: 'auto' }}
                />
            </Link>
        </div>

        {/* Right Slot: Actions */}
        <div className="flex items-center gap-0.5 sm:gap-2">
          {isWeb && <SearchBar />}
          {!isUserLoading && user && <NotificationBell />}
          <UserMenu />
        </div>
      </div>
      
      {/* Subtle bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
    </header>
    </>
  );
}
