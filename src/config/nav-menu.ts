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
    BarChart,
    History as HistoryIcon,
    Trophy,
    UtensilsCrossed,
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
      title: "Clubers",
      href: "/proveedores",
      icon: Building,
    },
    {
      title: "Ranking",
      href: "/leaderboard",
      icon: Trophy,
    },
    {
      title: "Cinco.Dos",
      href: "/cinco-dos",
      icon: UtensilsCrossed,
    },
    {
      title: "Anuncios",
      href: "/announcements",
      icon: Megaphone,
    },
    {
      title: "Mis Turnos",
      href: "/mis-turnos",
      icon: CalendarClock,
      role: ["user", "admin", "supplier"],
    },
    {
      title: "Mis Canjes",
      href: "/my-redemptions",
      icon: HistoryIcon,
      role: ["user", "admin", "supplier"],
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
          title: "Mis Analíticas",
          href: "/panel-cluber/analytics",
          icon: BarChart,
          role: ["supplier"],
        },
        {
          title: "Suscriptores",
          href: "/panel-cluber/subscribers",
          icon: Users,
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
      ]
    },
    {
        title: "Panel de Admin",
        href: "/panel-admin",
        icon: LayoutDashboard,
        role: ["admin"],
        items: [
            {
                title: "Analíticas Globales",
                href: "/panel-admin/analytics",
                icon: BarChart,
                role: ["admin"],
            },
            {
                title: "Solicitudes Cinco.Dos",
                href: "/panel-cluber/cinco-dos",
                icon: UtensilsCrossed,
                role: ["admin"],
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
    }
  ],
};
