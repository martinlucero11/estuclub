
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
    Trophy
} from 'lucide-react';

export const navConfig: NavConfig = {
  mainNav: [
    {
      title: "Inicio",
      href: "/",
      icon: Home,
    },
    {
      title: "Proveedores",
      href: "/proveedores",
      icon: Store,
    },
    {
      title: "Ranking",
      href: "/leaderboard",
      icon: Trophy,
    },
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
            title: "Gestión de Banners",
            href: "/dashboard/banners",
            icon: Image,
            role: ["admin"],
        },
      ]
    },
  ],
};
