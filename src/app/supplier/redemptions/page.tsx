'use client';

import React from 'react';
import { GraduationCap, Menu, User, Settings, LogOut, ShieldQuestion, Trophy, Briefcase, History } from 'lucide-react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
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
import { Button } from '../ui/button';
import { useAuth, useUser } from '@/firebase';
import { useAdmin } from '@/firebase/auth/use-admin';
import { useSupplier } from '@/firebase/auth/use-supplier';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import NotificationBell from './notification-bell';

function Logo() {
    return (
        <Link href="/" className="flex items-center justify-center gap-2 text-primary">
            <GraduationCap className="h-7 w-7" />
             <div className="flex items-center gap-1">
                <h1 className="flex items-center text-center font-bold text-primary font-headline">
                    <span className="text-[1.8rem]">Estu</span>
                    <span className="font-logo-script text-[1.8rem] text-primary">Club</span>
                </h1>
            </div>
        </Link>
    )
}

function UserMenu() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
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
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Ajustes</span>
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
    const { user } = useUser();
    const { isAdmin } = useAdmin();
    const { isSupplier } = useSupplier();

    const navItems = [
        { href: '/leaderboard', label: 'Ranking', icon: Trophy, requiresAuth: true, show: true },
        { href: '/supplier', label: 'Panel de Proveedor', icon: Briefcase, requiresAuth: true, show: isSupplier },
        { href: '/admin', label: 'Panel de Administración', icon: ShieldQuestion, requiresAuth: true, show: isAdmin },
    ];

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Abrir menú</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <SheetHeader>
                    <SheetTitle>
                        <Logo />
                    </SheetTitle>
                    <SheetDescription>
                        Navega por las secciones de la aplicación.
                    </SheetDescription>
                </SheetHeader>
                <nav className="mt-8 flex flex-col gap-2">
                    {navItems.map(({ href, label, icon: Icon, requiresAuth, show }) => {
                        if (requiresAuth && !user) return null;
                        if (show === false) return null; // Explicitly check for false to handle undefined

                        return (
                            <React.Fragment key={href}>
                                <SheetClose asChild>
                                    <Link href={href}>
                                        <Button variant="ghost" className="w-full justify-start text-base">
                                            <Icon className="mr-3 h-5 w-5" />
                                            {label}
                                        </Button>
                                    </Link>
                                </SheetClose>
                            </React.Fragment>
                        );
                    })}
                </nav>
            </SheetContent>
        </Sheet>
    )
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="w-1/3">
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