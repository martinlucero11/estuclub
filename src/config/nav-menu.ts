
import type { NavItem, SidebarNavItem } from "@/types/nav";
import { BarChart, Gift, History } from 'lucide-react';

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
      title: "Dashboard",
      // This section will be visible to both admins and suppliers.
      // The logic within the components at these routes will handle role-specific views.
      role: ["admin", "supplier"],
      items: [
        {
          title: "Beneficios",
          href: "/dashboard/benefits",
          icon: Gift,
          role: ["admin", "supplier"],
          items: [],
        },
        {
          title: "Canjes",
          href: "/dashboard/redemptions",
          icon: History,
          role: ["admin", "supplier"],
          items: [],
        },
      ],
    },
  ],
};
