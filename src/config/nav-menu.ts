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
    Package,
    History as HistoryIcon,
    Trophy,
    UtensilsCrossed,
    HelpCircle,
    AlertCircle,
    Heart as HeartIcon,
    ShoppingBag,
    Crown,
} from 'lucide-react';

export const navConfig: NavConfig = {
  mainNav: [
    {
      title: "Inicio",
      href: "/",
      icon: Home,
      category: "Explorar",
    },
    {
      title: "Beneficios",
      href: "/benefits",
      icon: Ticket,
      category: "Explorar",
    },
    {
      title: "Clubers",
      href: "/proveedores",
      icon: Building,
      category: "Explorar",
    },
    {
      title: "Ranking",
      href: "/leaderboard",
      icon: Trophy,
      category: "Explorar",
    },
    {
      title: "Cinco.Dos",
      href: "/cinco-dos",
      icon: UtensilsCrossed,
      category: "Explorar",
    },
    {
      title: "Anuncios",
      href: "/announcements",
      icon: Megaphone,
      category: "Explorar", // Keep in explorrar for now
    },
    {
      title: "Mis Turnos",
      href: "/mis-turnos",
      icon: CalendarClock,
      role: ["user", "admin", "supplier"],
      category: "Mi Actividad",
    },
    {
      title: "Mis Canjes",
      href: "/my-redemptions",
      icon: HistoryIcon,
      role: ["user", "admin", "supplier"],
      category: "Mi Actividad",
    },
    {
      title: "Favoritos",
      href: "/favorites",
      icon: HeartIcon, // I'll need to import this
      category: "Mi Actividad",
      role: ["user", "admin", "supplier"],
    },
    {
      title: "Solicitar ser Cluber",
      href: "/solicitar-cluber",
      icon: Building,
      role: ["user"],
      category: "Mi Actividad",
    },
    {
      title: "Panel de Control", // Renamed from Panel Cluber
      href: "/panel-cluber",
      icon: LayoutDashboard,
      role: ["admin", "supplier"],
      category: "Gestión",
    },
    {
      title: "Ajustes",
      href: "/settings",
      icon: Settings,
      role: ["user", "admin", "supplier"],
      category: "Gestión",
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
        {
            title: "Pedidos",
            href: "/panel-cluber/orders",
            icon: ShoppingBag,
            role: ["supplier"],
            supplierCapability: "deliveryEnabled",
        },
        {
            title: "Productos",
            href: "/panel-cluber/products",
            icon: Package,
            role: ["supplier"],
            supplierCapability: "deliveryEnabled",
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
                href: "/panel-cluber/analytics", // Changed from /panel-admin/analytics
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
                title: "Solicitudes de Clubers",
                href: "/panel-cluber/supplier-requests",
                icon: HelpCircle,
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
            {
                title: "Mantenimiento Usuarios",
                href: "/panel-cluber/supplier-management?tab=maintenance",
                icon: AlertCircle,
                role: ["admin"],
            },
            {
                title: "Herramientas del Sistema",
                href: "/panel-cluber/admin-tools",
                icon: Settings,
                role: ["admin"],
            },
        ]
    },
    {
        title: "👑 CONTROL CENTRAL",
        href: "/panel-admin",
        icon: Crown,
        role: ["admin"],
        items: [
            {
                title: "Mapa Logística Global",
                href: "/rider",
                icon: Building,
                role: ["admin"],
            },
            {
                title: "Verificación de Socios",
                href: "/verify",
                icon: Users,
                role: ["admin"],
            },
            {
                title: "Métricas en Tiempo Real",
                href: "/panel-cluber/analytics",
                icon: BarChart,
                role: ["admin"],
            },
            {
                title: "Gestión de Leads",
                href: "/panel-cluber/supplier-requests",
                icon: Megaphone,
                role: ["admin"],
            }
        ]
    }
  ],
};
