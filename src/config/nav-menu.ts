
import { Gift, History, LayoutDashboard, Megaphone, CalendarClock, Users } from "lucide-react";
import type { NavConfig } from "@/types/nav";

/**
 * @file Defines the navigation structure for the application, including the role-based dashboard sidebar.
 * 
 * Each item can have a `role` property. If not present, it's visible to all.
 * For suppliers, items can also have a `supplierCapability` property which is checked against their profile.
 */

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
      icon: LayoutDashboard,
      role: ["admin", "supplier"], 
      items: [
        // --- Common to Admin & Supplier ---
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
        // --- Supplier-specific capabilities ---
        {
          title: "Anuncios",
          href: "/dashboard/announcements",
          icon: Megaphone,
          role: ["supplier"], 
          supplierCapability: "announcementsEnabled", // Custom flag to check in supplierData
          items: [],
        },
        {
          title: "Turnos",
          href: "/dashboard/appointments",
          icon: CalendarClock,
          role: ["supplier"], 
          supplierCapability: "appointmentsEnabled", // Custom flag to check in supplierData
          items: [],
        },
        // --- Admin-only modules ---
        {
          title: "Gestión de Proveedores",
          href: "/dashboard/supplier-management",
          icon: Users,
          role: ["admin"], 
          items: [],
        },
        {
            title: "Aprobar Anuncios",
            href: "/dashboard/approval/announcements",
            icon: Megaphone,
            role: ["admin"], 
            items: [],
        }
      ],
    },
  ],
};
