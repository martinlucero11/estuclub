
'use client';

import React from 'react';
import { LayoutGrid, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthService, useUser, useDoc, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import NotificationBell from '@/components/layout/notification-bell';
import { navConfig } from '@/config/nav-menu';
import { hasRequiredRole } from '@/lib/utils';
import { LogOut, History, CalendarClock } from 'lucide-react';
import { doc } from 'firebase/firestore';

function Logo() {
    return (
        <Link href="/" className="flex items-center justify-center">
            <div className="relative w-32 h-10">
              <Image
                src="/logo.svg"
                alt="EstuClub"
                fill
                className="object-contain"
                style={{
                  filter: 'brightness(0) saturate(100%) invert(29%) sepia(81%) saturate(1988%) hue-rotate(318deg) brightness(92%) contrast(101%)'
                }} // Este filtro convierte el blanco a #d83762
                priority
              />
            </div>
        </Link>
    )
}

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
            <User className="h-6 w-6" />
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

function MainMenu() {
    const { roles } = useUser();
    const isAdmin = roles.includes('admin');
    const isSupplier = roles.includes('supplier');
    const allRoles = ['user', ...roles];

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <LayoutGrid className="h-6 w-6" />
                    <span className="sr-only">Abrir menú</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
                <SheetHeader className="p-6">
                    <SheetTitle><Logo /></SheetTitle>
                    <SheetDescription className="sr-only">Menú principal de navegación</SheetDescription>
                </SheetHeader>
                <nav className="mt-8 flex flex-col gap-1 px-6">
                    {navConfig.mainNav.map((item) => {
                        let isVisible;
                        if (item.href === '/panel-cluber') {
                            isVisible = isAdmin || isSupplier;
                        } else {
                            isVisible = hasRequiredRole(allRoles, item.role);
                        }
                        
                        if (!isVisible) return null;

                        const Icon = item.icon;
                        return (
                            <SheetClose asChild key={item.href}>
                                <Link href={item.href}>
                                    <Button variant="ghost" className="w-full justify-start text-base px-3 py-2">
                                        {Icon && <Icon className="mr-3 h-5 w-5" />}
                                        {item.title}
                                    </Button>
                                </Link>
                            </SheetClose>
                        )
                    })}
                </nav>
                <div className="mt-auto p-6 border-t border-slate-100 dark:border-slate-800 text-center text-sm text-slate-500">
                    <p className="font-medium">©Mismo Studio - 2026</p>
                    <p className="mt-1 text-[#d83762] font-semibold">Con amor para Mela &lt;3</p>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="w-1/3 flex justify-start items-center gap-2">
            <MainMenu />
        </div>
        <div className="w-1/3 flex justify-center">
            <Logo />
        </div>
        <div className="w-1/3 flex justify-end items-center gap-2">
            <NotificationBell />
            <UserMenu />
        </div>
      </div>
    </header>
  );
}
