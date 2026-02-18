
import { Gift, History } from "lucide-react";
import type { NavConfig } from "@/types/nav";

/**
 * @file Defines the navigation structure for the application, including main navigation
 * and the role-based dashboard sidebar.
 */

// The single, unified navigation configuration for the entire application.
export const navConfig: NavConfig = {
  mainNav: [
    {
      title: "Leaderboard",
      href: "/leaderboard",
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
