
/**
 * @file Centralized type definitions for application-wide data models.
 */

import { Timestamp } from "firebase/firestore";

/**
 * Represents the profile data stored in /roles_supplier/{uid}
 */
export interface SupplierProfile {
  id: string; // Document ID (same as user UID)
  displayName: string;
  email: string;
  // --- Module Capabilities ---
  announcementsEnabled?: boolean;
  appointmentsEnabled?: boolean;
  premiumBenefitsEnabled?: boolean; // Example for future use
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
  // Tracking fields (optional)
  clicks?: number;
  totalRedemptions?: number;
  createdAt: Timestamp;
}

/**
 * Represents a redeemed benefit in the /benefitRedemptions collection.
 */
export interface BenefitRedemption {
  id: string; // Document ID
  benefitId: string;
  supplierId: string;
  userId: string;
  // For admin view
  userDisplayName?: string;
  benefitTitle?: string;
  supplierDisplayName?: string;

  redemptionCode: string;
  redeemedAt: Timestamp;
  validated: boolean; // True if the QR code was scanned and validated
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
}
