
import type { LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

// Define a specific type for Lucide Icons to ensure type safety
type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;

/**
 * Represents a basic navigation link.
 */
export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean; // Can the user click it?
  external?: boolean; // Is it an external link?
}

/**
 * Represents a link within the sidebar, which includes an icon and role-based access.
 */
export interface SidebarNavItemLink {
  title: string;
  href: string;
  icon: LucideIcon;
  role?: string | string[]; // Role is flexible for items
  items?: SidebarNavItemLink[]; 
}

/**
 * Represents a top-level section in the sidebar, containing a title and a list of links.
 */
export interface SidebarNavItem {
  title: string;
  role?: string | string[]; // Role is flexible for sections
  items: SidebarNavItemLink[];
}

/**
 * Defines the overall navigation structure for the entire application.
 */
export interface NavConfig {
  mainNav: NavItem[];
  sidebarNav: SidebarNavItem[];
}
