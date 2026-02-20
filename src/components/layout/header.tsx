'use client';

import React from 'react';
import { GraduationCap, Menu, User, Settings, LogOut, History } from 'lucide-react';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthService, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import NotificationBell from '@/components/layout/notification-bell';
import { navConfig } from '@/config/nav-menu';
import { hasRequiredRole } from '@/lib/utils';
import type { NavItem, SidebarNavItem, SidebarNavItemLink } from '@/types/nav';

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
    const { user, roles, supplierData } = useUser();

    const isItemVisible = (item: SidebarNavItemLink): boolean => {
        const roleMatch = hasRequiredRole(roles, item.role);
        if (!roleMatch) return false;

        if (item.supplierCapability && roles.includes('supplier')) {
            return supplierData ? !!supplierData[item.supplierCapability] : false;
        }

        return true;
    }

    const accessibleSidebarSections = navConfig.sidebarNav
        .map(section => ({
            ...section,
            items: section.items?.filter(isItemVisible)
        }))
        .filter(section => {
            // A section is visible if it's a direct link and has the role,
            // or if it's a group with at least one visible item.
            return hasRequiredRole(roles, section.role) && (!section.items || section.items.length > 0);
        });


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
                    <SheetTitle><Logo /></SheetTitle>
                    <SheetDescription>Navega por la aplicación.</SheetDescription>
                </SheetHeader>
                <nav className="mt-8 flex flex-col gap-1">
                    {navConfig.mainNav.map(({ href, title }: NavItem) => (
                        <SheetClose asChild key={href}>
                            <Link href={href}>
                                <Button variant="ghost" className="w-full justify-start text-base px-3 py-2">
                                    {title}
                                </Button>
                            </Link>
                        </SheetClose>
                    ))}
                    
                    {user && accessibleSidebarSections.length > 0 && <DropdownMenuSeparator className="my-2" />}

                    {user && accessibleSidebarSections.map((section) => {
                       
                        // If it's a direct link (no items), render a simple button
                        if (!section.items) {
                             const Icon = section.icon;
                            return (
                                <SheetClose asChild key={section.href}>
                                    <Link href={section.href}>
                                        <Button variant="ghost" className="w-full justify-start text-base px-3 py-2">
                                             {Icon && <Icon className="mr-3 h-5 w-5" />}
                                            {section.title}
                                        </Button>
                                    </Link>
                                </SheetClose>
                            )
                        }

                        // If it's a group with items, render an accordion
                        const Icon = section.icon;
                        return (
                            <Accordion type="single" collapsible className="w-full" key={section.title} defaultValue='item-0'>
                                <AccordionItem value='item-0' className="border-b-0">
                                    <AccordionTrigger className="w-full flex items-center justify-between text-base font-medium hover:no-underline px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded-md">
                                         <div className="flex items-center">
                                            {Icon && <Icon className="mr-3 h-5 w-5" />}
                                            <span>{section.title}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-1 pb-0">
                                        <div className="ml-4 flex flex-col gap-1 border-l pl-4">
                                            {section.items.map((item) => {
                                                const ItemIcon = item.icon;
                                                return (
                                                    <SheetClose asChild key={item.href}>
                                                        <Link href={item.href}>
                                                            <Button variant="ghost" className="w-full justify-start text-base font-normal">
                                                                {ItemIcon && <ItemIcon className="mr-3 h-5 w-5 text-muted-foreground" />}
                                                                {item.title}
                                                            </Button>
                                                        </Link>
                                                    </SheetClose>
                                                );
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        );
                    })}
                </nav>
            </SheetContent>
        </Sheet>
    );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="w-1/3"><MainMenu /></div>
        <div className="w-1/3 flex justify-center"><Logo /></div>
        <div className="w-1/3 flex justify-end items-center gap-2">
            <NotificationBell />
            <UserMenu />
        </div>
      </div>
    </header>
  );
}
