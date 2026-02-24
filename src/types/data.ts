
/**
 * @file Centralized type definitions for application-wide data models.
 */

import { Timestamp } from "firebase/firestore";

/**
 * Defines the possible roles a user can have within the application.
 */
export type UserRole = 'admin' | 'supplier' | 'user';

/**
 * Defines the categories for Clubers (suppliers).
 */
export type CluberCategory = 'Comercio' | 'Profesional' | 'Empresa' | 'Emprendimiento' | 'Salud' | 'Estética' | 'Servicios';
export const cluberCategories: CluberCategory[] = ['Comercio', 'Profesional', 'Empresa', 'Emprendimiento', 'Salud', 'Estética', 'Servicios'];


/**
 * Represents the profile data stored in /roles_supplier/{uid}
 */
export interface SupplierProfile {
  id: string; // Document ID (same as user UID)
  name: string;
  email: string;
  type: CluberCategory;
  slug: string;
  description?: string;
  logoUrl?: string;
  coverPhotoUrl?: string;
  address?: string;
  whatsapp?: string;
  isFeatured?: boolean;
  createdAt?: Timestamp;
  // --- Module Capabilities ---
  appointmentsEnabled?: boolean;
  canCreatePerks?: boolean; // New permission for benefits
  announcementsEnabled?: boolean;
  [key: string]: any;
}

/**
 * Represents a benefit item in the /benefits collection.
 */
export interface Benefit {
  id: string; // Document ID
  supplierId: string; // UID of the supplier who owns it
  title: string;
  description: string;
  price: number; // Cost in points
  category: string;
  stock: number;
  status: 'active' | 'inactive';
  supplierName?: string; // Denormalized for admin views
  // Tracking fields (optional)
  clicks?: number;
  totalRedemptions?: number;
  createdAt: Timestamp;
  redemptionCount?: number;
  [key: string]: any;
}

/**
 * Represents a redeemed benefit in the /benefitRedemptions collection.
 */
export interface BenefitRedemption {
  id: string; // Document ID
  benefitId: string;
  supplierId: string;
  userId: string;
  // Denormalized data for admin views
  userName?: string;
  benefitTitle?: string;
  supplierName?: string;

  redeemedAt: Timestamp;
  [key: string]: any;
}

/**
 * Represents an announcement in the /announcements collection.
 */
export interface Announcement {
  id: string; // Document ID
  supplierId: string;
  title: string;
  content: string;
  imageUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp;
  approvedAt?: Timestamp;
  [key: string]: any;
}

/**
 * Represents an availability slot defined by a supplier.
 */
export interface AppointmentSlot {
    id: string;
    supplierId: string;
    startTime: Timestamp;
    endTime: Timestamp;
    status: 'available' | 'booked';
    bookedBy?: string; // UID of the student who booked it
    [key: string]: any;
}

export interface Appointment {
    id: string;
    userId: string;
    userName: string;
    userDni: string;
    userPhone: string;
    serviceId: string;
    serviceName: string;
    startTime: Timestamp;
    endTime: Timestamp;
    status: 'confirmed' | 'cancelled';
    [key: string]: any;
}
