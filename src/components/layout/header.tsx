'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, LogOut, History, CalendarClock, LayoutGrid } from 'lucide-react';
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
import { MainNav } from './main-nav';
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
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">
            Iniciar Sesión
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

function MobileNav() {
    const { roles } = useUser();
    const allRoles = ['user', ...roles];

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <LayoutGrid className="h-6 w-6" />
                    <span className="sr-only">Abrir menú</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
                <SheetHeader className="p-6">
                    <SheetTitle>
                        <SheetClose asChild>
                            <Link href="/" className="flex items-center justify-center">
                                <Image src="/logo.svg" alt="EstuClub Logo" width={120} height={32} className="dark:invert" priority />
                            </Link>
                        </SheetClose>
                    </SheetTitle>
                    <SheetDescription className="sr-only">Menú principal de navegación</SheetDescription>
                </SheetHeader>
                <nav className="mt-8 flex flex-col gap-1 px-4">
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
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container grid h-16 grid-cols-3 items-center">
        {/* Left Slot: Navigation */}
        <div className="flex items-center justify-start">
          <div className="hidden md:flex">
            <MainNav items={navConfig.mainNav} />
          </div>
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>

        {/* Center Slot: Logo */}
        <div className="flex items-center justify-center">
          <Link href="/" aria-label="Homepage">
            <Image src="/logo.svg" alt="EstuClub Logo" width={100} height={26} className="dark:invert" priority />
          </Link>
        </div>

        {/* Right Slot: Actions */}
        <div className="flex items-center justify-end space-x-2">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
