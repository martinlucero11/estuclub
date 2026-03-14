'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, LogOut, History, CalendarClock, LayoutGrid, LogIn } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import NotificationBell from '@/components/layout/notification-bell';
import { navConfig } from '@/config/nav-menu';
import { hasRequiredRole } from '@/lib/utils';

function UserMenu() {
  const { user, isUserLoading } = useUser(); 
  const auth = useAuthService();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (isUserLoading) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  if (!user) {
    return (
      <Button asChild variant="ghost" size="icon">
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
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-9 w-9">
                {user.photoURL && (
                <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
                )}
                <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
        </Button>
      </DropdownMenuTrigger>
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
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Mi Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/my-redemptions')}>
          <History className="mr-2 h-4 w-4" />
          <span>Mis Canjes</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/mis-turnos')}>
          <CalendarClock className="mr-2 h-4 w-4" />
          <span>Mis Turnos</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Sidebar for all screen sizes
function AppSidebar() {
    const { roles } = useUser();
    const allRoles = ['user', ...roles];

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <LayoutGrid className="h-6 w-6" />
                    <span className="sr-only">Abrir menú</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-72 sm:w-80">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle>
                        <SheetClose asChild>
                             <Link href="/" className="flex items-center justify-center">
                                <Image src="/logo.svg" alt="EstuClub Logo" width={120} height={32} className="invert dark:invert-0" priority style={{ height: 'auto' }} />
                            </Link>
                        </SheetClose>
                    </SheetTitle>
                    <SheetDescription className="sr-only">Menú principal de navegación</SheetDescription>
                </SheetHeader>
                <nav className="mt-6 flex-1 flex-col gap-1 px-4">
                    {navConfig.mainNav.map((item) => {
                        const isVisible = hasRequiredRole(allRoles, item.role);
                        if (!isVisible) return null;

                        const Icon = item.icon;
                        return (
                            <SheetClose asChild key={item.href}>
                                <Link href={item.href}>
                                    <Button variant="ghost" className="w-full justify-start text-base py-3 h-auto">
                                        {Icon && <Icon className="mr-3 h-5 w-5" />}
                                        {item.title}
                                    </Button>
                                </Link>
                            </SheetClose>
                        )
                    })}
                </nav>
            </SheetContent>
        </Sheet>
    );
}

export default function Header() {
  const { user, isUserLoading } = useUser();
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container relative flex h-16 items-center justify-between px-4">
        {/* Left Slot: Actions */}
        <div className="flex items-center">
          <AppSidebar />
        </div>

        {/* Center Slot: Absolutely Positioned Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/" aria-label="Homepage">
                <Image src="/logo.svg" alt="EstuClub Logo" width={120} height={32} className="invert dark:invert-0" priority style={{ height: 'auto' }} />
            </Link>
        </div>

        {/* Right Slot: Actions */}
        <div className="flex items-center space-x-2">
          {!isUserLoading && user && <NotificationBell />}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
