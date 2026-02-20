
import { NavConfig } from "@/types/nav";
import {
    LayoutDashboard,
} from 'lucide-react';

export const navConfig: NavConfig = {
  mainNav: [
    {
      title: "Inicio",
      href: "/",
    },
    {
      title: "Proveedores",
      href: "/proveedores",
    },
    {
      title: "Ranking",
      href: "/leaderboard",
    },
  ],
  sidebarNav: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      role: ["admin", "supplier"], 
    },
  ],
};
