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
    ShieldCheck
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
      category: "Explorar",
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
        title: "Mis Pedidos",
        href: "/orders",
        icon: ShoppingBag,
        role: ["user", "admin", "supplier"],
        category: "Mi Actividad",
    },
    {
      title: "Favoritos",
      href: "/favorites",
      icon: HeartIcon,
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
      title: "Panel de Control",
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
          href: "/panel-cluber/beneficios",
          icon: Gift,
          role: ["admin", "supplier"],
        },
        {
          title: "Configuración",
          href: "/panel-cluber/configuracion",
          icon: Settings,
          role: ["admin", "supplier"],
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
        title: "👑 CONTROL CENTRAL",
        href: "/panel-admin",
        icon: Crown,
        role: ["admin"],
        items: [
            {
                title: "Dashboard Overlord",
                href: "/panel-admin",
                icon: LayoutDashboard,
                role: ["admin"],
            },
            {
                title: "Verificación Global",
                href: "/verify",
                icon: ShieldCheck,
                role: ["admin"],
            },
            {
                title: "Contenido Extremo",
                href: "/panel-admin/content",
                icon: Megaphone,
                role: ["admin"],
            },
            {
                title: "Mapa Logística",
                href: "/rider",
                icon: Building,
                role: ["admin"],
            },
            {
                title: "Métricas en Tiempo Real",
                href: "/panel-cluber/analytics",
                icon: BarChart,
                role: ["admin"],
            },
            {
                title: "Herramientas Críticas",
                href: "/panel-cluber/admin-tools",
                icon: Settings,
                role: ["admin"],
            }
        ]
    }
  ],
};

