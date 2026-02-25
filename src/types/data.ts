
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


export const benefitCategories = [
  'Comercios',
  'Eventos',
  'Comida',
  'Educación',
  'Entretenimiento',
] as const;
export type BenefitCategory = typeof benefitCategories[number];

export interface Benefit {
  id: string;
  title: string;
  description: string;
  category: BenefitCategory;
  image: string;
  imageUrl: string;
  location?: string;
  ownerId: string;
  createdAt?: Timestamp;
  points: number;
  cost?: number;
  redemptionLimit?: number;
  validUntil?: Timestamp;
  availableDays?: string[];
  redemptionCount?: number;
  active?: boolean;
  isFeatured?: boolean;
  supplierName?: string;
  status?: 'active' | 'inactive';
  stock?: number;
  [key: string]: any;
}

// Serializable type for client-side components
export type SerializableBenefit = Omit<Benefit, 'createdAt' | 'validUntil'> & {
  createdAt: string; // Always a string
  validUntil?: string; // Optional string
};

/**
 * Represents an announcement in the /announcements collection.
 */
export interface Announcement {
  id: string; // Document ID
  supplierId: string;
  title: string;
  content: string;
  authorId?: string;
  authorUsername?: string;
  imageUrl?: string;
  linkUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp;
  approvedAt?: Timestamp;
  createdAt: Timestamp;
  [key: string]: any;
}

export interface SerializableAnnouncement extends Omit<Announcement, 'createdAt' | 'submittedAt' | 'approvedAt'> {
  id: string;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
}

export type CarouselItem = (SerializableBenefit & { type: 'benefit' }) | (SerializableAnnouncement & { type: 'announcement' });

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  [key: string]: any;
}

export interface DaySchedule {
  active: boolean;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  [key: string]: any;
}

export interface Availability {
    schedule: {
        [day: string]: DaySchedule;
    };
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
    startTime: Date | Timestamp;
    endTime: Date | Timestamp;
    status: 'confirmed' | 'cancelled';
    [key: string]: any;
}

export interface BenefitRedemption {
  id: string;
  benefitId: string;
  benefitTitle: string;
  benefitDescription: string;
  benefitImageUrl: string;
  benefitLocation?: string;
  supplierId: string;
  supplierName: string;
  userId: string;
  userName: string;
  userDni: string;
  redeemedAt: Timestamp;
  qrCodeValue: string;
  status: 'pending' | 'used';
  usedAt?: Timestamp;
  pointsGranted: number;
  [key: string]: any;
}

export type SerializableBenefitRedemption = Omit<BenefitRedemption, 'redeemedAt' | 'usedAt'> & {
  redeemedAt: string;
  usedAt?: string;
};

export interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
  isActive: boolean;
  colorScheme: 'pink' | 'yellow' | 'blue';
  createdAt: Timestamp;
  [key: string]: any;
}

export type SerializableBanner = Omit<Banner, 'createdAt'> & {
  createdAt: string;
};

export interface Category {
  id: string;
  name: string;
  emoji: string;
  colorClass: string;
  order?: number;
  [key: string]: any;
}

export const homeSectionTypes = [
    'categories_grid', 
    'benefits_carousel', 
    'single_banner', 
    'suppliers_carousel',
    'announcements_carousel',
    'featured_suppliers_carousel',
    'new_suppliers_carousel',
    'featured_perks'
] as const;
export type HomeSectionType = typeof homeSectionTypes[number];

export interface HomeSection {
  id: string;
  title: string;
  type: HomeSectionType;
  order: number;
  isActive: boolean;
  filter?: string; // For category on benefits_carousel
  bannerId?: string; // For single_banner
  createdAt?: Timestamp;
  [key: string]: any;
}

export type SerializableHomeSection = Omit<HomeSection, 'createdAt'> & {
    createdAt: string;
};

export interface AppointmentSlot {
    id: string;
    supplierId: string;
    startTime: Timestamp;
    endTime: Timestamp;
    status: 'available' | 'booked';
    bookedBy?: string; // UID of the student who booked it
    [key: string]: any;
}
