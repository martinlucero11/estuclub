
import type { LucideIcon } from "lucide-react";

/**
 * @file Centralized type definitions for navigation-related structures.
 */

/**
 * Base interface for a navigation link. 
 * Can be extended for more specific use cases.
 */
export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  icon?: LucideIcon;
  label?: string;
  role?: string | string[];
  category?: string; // For grouping in sidebar
  supplierCapability?: keyof import('./data').SupplierProfile;
}

/**
 * Extends NavItem for links within the sidebar, which can have nested items
 * and specific capability checks for suppliers.
 */
export interface SidebarNavItemLink extends NavItem {
  items?: SidebarNavItemLink[];
}

/**
 * Represents a top-level section in the sidebar, containing a title and a list of links.
 * It can also be a direct link if it doesn't have sub-items.
 */
export interface SidebarNavItem extends SidebarNavItemLink {}

/**
 * Defines the overall navigation structure for the entire application.
 */
export interface NavConfig {
  mainNav: NavItem[];
  sidebarNav: SidebarNavItem[];
}

