
import { NavConfig } from "@/types/nav";
import {
    LayoutDashboard,
    Store,
    Receipt,
    Megaphone,
    CalendarClock,
    Users,
    CheckCheck, // Added for approve-announcements
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
      href: "/dashboard", // <-- ADDED: Satisfy TypeScript requirement
      icon: LayoutDashboard,
      role: ["admin", "supplier"], 
      items: [
        {
          title: "Beneficios",
          href: "/dashboard/benefits",
          icon: Store,
          role: ["admin", "supplier"],
        },
        {
          title: "Canjes",
          href: "/dashboard/redemptions",
          icon: Receipt,
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
          title: "Aprobar Anuncios",
          href: "/dashboard/approve-announcements",
          icon: CheckCheck,
          role: ["admin"],
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
      ],
    },
  ],
};
