'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, LogOut, LayoutGrid, LogIn, Heart } from 'lucide-react';
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

function UserMenu() {
  const { user, isUserLoading } = useUser(); 
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

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <DropdownMenu>
        <MagneticButton>
          <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20" aria-label="Menú de usuario">
                  <Avatar className="h-9 w-9">
                      {user.photoURL && (
                      <AvatarImage src={user.photoURL} alt={user.displayName || 'Avatar de usuario'} />
                      )}
                      <AvatarFallback>{userInitial}</AvatarFallback>
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
    const { roles } = useUser();
    const allRoles = ['user', ...roles];
    const pathname = usePathname();

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
                    <nav className="flex flex-col gap-1.5">
                        {navConfig.mainNav.map((item) => {
                            if (!hasRequiredRole(allRoles, item.role)) return null;

                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            
                            return (
                                <SheetClose asChild key={item.href}>
                                    <Link href={item.href}>
                                        <Button 
                                            variant="ghost" 
                                            className={cn(
                                                "w-full justify-start text-base py-6 h-auto transition-all duration-300 group rounded-2xl relative",
                                                isActive ? "bg-primary/10 text-primary" : "hover:bg-white/5 opacity-70 hover:opacity-100"
                                            )}
                                        >
                                            <div className={cn(
                                                "mr-4 p-2.5 rounded-xl transition-all duration-300",
                                                isActive ? "bg-primary text-white shadow-lg shadow-primary/25" : "bg-white/5 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                            )}>
                                                {Icon && <Icon className="h-5 w-5" />}
                                            </div>
                                            <span className="font-bold tracking-tight">{item.title}</span>
                                            
                                            {isActive && (
                                                <motion.div 
                                                    layoutId="active-pill"
                                                    className="absolute right-4 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(236,72,153,0.8)]"
                                                />
                                            )}
                                        </Button>
                                    </Link>
                                </SheetClose>
                            )
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
  return (
    <header className="sticky top-0 z-40 w-full bg-primary shadow-premium">
      <div className="container relative flex h-16 items-center justify-between px-4">
        {/* Left Slot: Actions */}
        <div className="flex items-center">
          <AppSidebar />
        </div>

        {/* Center Slot: Absolutely Positioned Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/" aria-label="Homepage">
                <Image 
                    src="/logo.svg" 
                    alt="EstuClub Logo" 
                    width={120} 
                    height={32} 
                    priority
                    className="h-7 sm:h-8 brightness-110"
                    style={{ width: 'auto' }}
                />
            </Link>
        </div>

        {/* Right Slot: Actions */}
        <div className="flex items-center gap-0.5 sm:gap-2">
          <SearchBar />
          {!isUserLoading && user && <NotificationBell />}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
