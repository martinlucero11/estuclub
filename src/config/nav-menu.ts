
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
      title: "Beneficios",
      href: "/benefits",
    },
    {
      title: "Anuncios",
      href: "/announcements",
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
