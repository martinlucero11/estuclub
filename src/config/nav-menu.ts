
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
    Settings,
    Shapes,
    LayoutTemplate,
    CalendarDays,
    QrCode,
    Building,
} from 'lucide-react';

export const navConfig: NavConfig = {
  mainNav: [
    {
      title: "Inicio",
      href: "/",
      icon: Home,
    },
    {
      title: "Beneficios",
      href: "/benefits",
      icon: Ticket,
    },
    {
      title: "Mis Turnos",
      href: "/mis-turnos",
      icon: CalendarClock,
      role: ["user"],
    },
    {
      title: "Anuncios",
      href: "/announcements",
      icon: Megaphone,
    },
    {
      title: "Turnos",
      href: "/turnos",
      icon: CalendarDays,
    },
    {
      title: "Panel Cluber",
      href: "/panel-cluber",
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
      title: "Panel Cluber",
      href: "/panel-cluber",
      icon: LayoutDashboard,
      role: ["admin", "supplier"],
      items: [
        {
          title: "Mi Perfil de Cluber",
          href: "/panel-cluber/supplier-profile",
          icon: Building,
          role: ["supplier"],
        },
        {
          title: "Escanear QR",
          href: "/panel-cluber/scanner",
          icon: QrCode,
          role: ["admin", "supplier"],
        },
        {
          title: "Beneficios",
          href: "/panel-cluber/benefits",
          icon: Gift,
          role: ["admin", "supplier"],
        },
        {
          title: "Canjes",
          href: "/panel-cluber/redemptions",
          icon: Ticket,
          role: ["admin", "supplier"],
        },
        {
          title: "Anuncios",
          href: "/panel-cluber/announcements",
          icon: Megaphone,
          role: ["supplier"],
          supplierCapability: "announcementsEnabled",
        },
        {
            title: "Turnos",
            href: "/panel-cluber/appointments",
            icon: CalendarClock,
            role: ["supplier"],
            supplierCapability: "appointmentsEnabled",
        },
        {
            title: "Gestión de Clubers",
            href: "/panel-cluber/supplier-management",
            icon: Users,
            role: ["admin"],
        },
        {
            title: "Diseño de Inicio",
            href: "/panel-cluber/home-builder",
            icon: LayoutTemplate,
            role: ["admin"],
        },
        {
            title: "Gestión de Banners",
            href: "/panel-cluber/banners",
            icon: Image,
            role: ["admin"],
        },
        {
            title: "Gestión de Categorías",
            href: "/panel-cluber/categories",
            icon: Shapes,
            role: ["admin"],
        },
      ]
    },
  ],
};
