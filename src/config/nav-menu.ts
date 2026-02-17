
import type { NavItem, SidebarNavItem } from "@/types/nav";
import { BarChart, Building, Gift, Megaphone, Users, History, BarChart2 } from 'lucide-react';

interface NavConfig {
  mainNav: NavItem[];
  sidebarNav: SidebarNavItem[];
}

export const navConfig: NavConfig = {
  mainNav: [
    {
      title: "Leaderboard",
      href: "/leaderboard",
    },
    {
      title: "Beneficios",
      href: "/benefits",
    },
    {
        title: "Anuncios",
        href: "/announcements",
    },
    {
      title: "Proveedores",
      href: "/proveedores",
    },
  ],
  sidebarNav: [
    {
      title: "Panel de Control",
      items: [
        {
          title: "Dashboard",
          href: "/admin",
          icon: BarChart,
          role: "admin",
          items: [],
        },
        {
          title: "Proveedores",
          href: "/admin/suppliers",
          icon: Building,
          role: "admin",
          items: [],
        },
        {
          title: "Anuncios",
          href: "/admin/announcements",
          icon: Megaphone,
          role: "admin",
          items: [],
        },
        {
          title: "Usuarios",
          href: "/admin/users",
          icon: Users,
          role: "admin",
          items: [],
        },
      ],
    },
  ],
};
