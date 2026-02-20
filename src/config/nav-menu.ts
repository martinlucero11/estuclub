
import { NavConfig } from "@/types/nav";
import {
    LayoutDashboard,
    Gift,
    Ticket,
    Users,
    Image,
    Megaphone,
    CalendarClock,
    Home,
    Store,
    Trophy,
    Settings,
    Shapes,
    LayoutTemplate,
} from 'lucide-react';

export const navConfig: NavConfig = {
  mainNav: [
    {
      title: "Inicio",
      href: "/",
      icon: Home,
    },
    {
      title: "Ranking",
      href: "/leaderboard",
      icon: Trophy,
    },
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      role: ["admin", "supplier"],
    },
    {
      title: "Ajustes",
      href: "/settings",
      icon: Settings,
      role: ["user", "admin", "supplier"], // Any logged in user
    }
  ],
  sidebarNav: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      role: ["admin", "supplier"],
      items: [
        {
          title: "Beneficios",
          href: "/dashboard/benefits",
          icon: Gift,
          role: ["admin", "supplier"],
        },
        {
          title: "Canjes",
          href: "/dashboard/redemptions",
          icon: Ticket,
          role: ["admin", "supplier"],
        },
        {
          title: "Anuncios",
          href: "/dashboard/announcements",
          icon: Megaphone,
          role: ["supplier"],
          supplierCapability: "announcementsEnabled",
        },
        {
            title: "Turnos",
            href: "/dashboard/appointments",
            icon: CalendarClock,
            role: ["supplier"],
            supplierCapability: "appointmentsEnabled",
        },
        {
            title: "Gestión de Proveedores",
            href: "/dashboard/supplier-management",
            icon: Users,
            role: ["admin"],
        },
        {
            title: "Diseño de Inicio",
            href: "/dashboard/home-builder",
            icon: LayoutTemplate,
            role: ["admin"],
        },
        {
            title: "Gestión de Banners",
            href: "/dashboard/banners",
            icon: Image,
            role: ["admin"],
        },
        {
            title: "Gestión de Categorías",
            href: "/dashboard/categories",
            icon: Shapes,
            role: ["admin"],
        },
      ]
    },
  ],
};
