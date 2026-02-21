
'use client';

import React from 'react';
import { LayoutGrid, User } from 'lucide-react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
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
import { useAuthService, useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import NotificationBell from '@/components/layout/notification-bell';
import { navConfig } from '@/config/nav-menu';
import { hasRequiredRole } from '@/lib/utils';
import { LogOut, History } from 'lucide-react';
import { doc } from 'firebase/firestore';

function Logo() {
    return (
        <Link href="/" className="flex items-center justify-center">
            {/* @lock - DO NOT MODIFY THIS LOGO IN FUTURE REFACTORS */}
            <h1 className="flex items-baseline text-center font-bold text-primary">
                <span className="font-sans text-2xl sm:text-3xl font-black tracking-tighter">Estu</span>
                <span className="font-logo-script text-[2.2rem] sm:text-[2.6rem] font-bold leading-[0.5]">Club</span>
            </h1>
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
    const allRoles = ['user', ...roles];

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <LayoutGrid className="h-6 w-6" />
                    <span className="sr-only">Abrir menú</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <SheetHeader>
                    <SheetTitle><Logo /></SheetTitle>
                    <SheetDescription>Navega por la aplicación.</SheetDescription>
                </SheetHeader>
                <nav className="mt-8 flex flex-col gap-1">
                    {navConfig.mainNav.map((item) => {
                        const isVisible = hasRequiredRole(allRoles, item.role);
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
