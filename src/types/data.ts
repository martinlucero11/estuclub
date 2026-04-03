

/**
 * @file Centralized type definitions for application-wide data models.
 */

import { Timestamp, WhereFilterOp } from "firebase/firestore";

/**
 * Defines a structured filter for Firestore queries.
 */
export type WhereFilter = {
  field: string;
  op: WhereFilterOp;
  value: any;
};


/**
 * Defines the possible roles a user can have within the application.
 */
export type UserRole = 'admin' | 'supplier' | 'cluber' | 'user' | 'rider' | 'rider_pending' | 'cluber_pending';

/**
 * Represents the data stored for a user in the /users collection.
 */
export interface UserProfile {
    id: string;
    uid: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    dni: string;
    phone: string;
    gender: string;
    university: string;
    major: string;
    points: number;
    photoURL?: string;
    avatarSeed?: string;
    useAvatar?: boolean;  // suppliers: true = show DiceBear avatar, false/undefined = show logo
    role: UserRole;
    favoriteBenefits?: string[];
    favoriteSuppliers?: string[];
    xp?: number;
    level?: number;
    isCincoDos?: boolean; // Proyecto Social Cinco.Dos (Comedor Estudiantil)
    location?: {
      address: string;
      city?: string;
      lat?: number;
      lng?: number;
    };
    // Student Info
    isStudent: boolean;
    studentStatus?: 'pending' | 'submitted' | 'verified';
    certificateDeadline?: Timestamp;
    institution: string;
    educationLevel: string;
    career: string;
    studentCertificateUrl: string;
    mp_linked?: boolean; // Mercado Pago account linked status for riders
    mp_grace_period_end?: Timestamp; // Deadline to link MP before access is restricted
    // Rider & Subscription Info
    subscriptionStatus?: 'none' | 'pending' | 'active' | 'expired';
    subscriptionPaidAt?: Timestamp;
    addresses?: UserAddress[];
    createdAt: Timestamp;
}

/**
 * Represents a saved location for a user (Home, Work, etc.)
 */
export interface UserAddress {
  id: string;
  label: string; // "Casa", "Trabajo", "Facu", etc.
  address: string;
  lat?: number;
  lng?: number;
  city?: string;
  isDefault?: boolean;
  notes?: string; // "Portero 2B", "Reja blanca", etc.
}


/**
 * Defines the categories for Clubers (suppliers).
 */
export const cluberCategories = ['Comercio', 'Profesional', 'Empresa', 'Emprendimiento', 'Salud', 'Estética', 'Servicios'] as const;
export type CluberCategory = typeof cluberCategories[number];

export const deliveryCategories = ['Comida Rápida', 'Restaurantes', 'Farmacia', 'Supermercado', 'Bebidas', 'Otros'] as const;
export type DeliveryCategory = typeof deliveryCategories[number];


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
  address?: string;
  whatsapp?: string;
  coverUrl?: string; // High-quality promotional image for banners/promo cards
  isVisible: boolean; // Admin-controlled
  isFeatured: boolean; // Admin-controlled
  featuredRank?: number; // Admin-controlled
  homeCarousels?: string[]; // Admin-controlled
  createdAt?: Timestamp;
  // --- Module Capabilities ---
  appointmentsEnabled?: boolean;
  canCreateBenefits?: boolean;
  canSendNotifications?: boolean;
  announcementsEnabled?: boolean;
  avgRating?: number;
  reviewCount?: number;
  // --- Delivery Lite ---
  deliveryEnabled?: boolean;
  deliveryCost?: number;
  deliveryCostType?: 'free' | 'customer' | 'to_be_agreed';
  minOrderAmount?: number;
  deliveryRadius?: number;
  deliveryCategory?: string; // e.g., 'Comida Rápida', 'Restaurantes', 'Farmacia', etc.
  location?: {
    lat: number;
    lng: number;
    address: string;
    city?: string;
  };
  operatingHours?: Availability;
  deliverySchedule?: {
    [day: string]: {
      active: boolean;
      intervals: { start: string; end: string }[];
    };
  };
  isDeliveryPaused?: boolean;
  avgPrepTime?: number; // In minutes
  menuSections?: string[]; // Custom subcategories defined by the supplier
  mp_linked?: boolean;
  mp_grace_period_end?: Timestamp;
  isCincoDos?: boolean; // PWA plus membership
  commissionPercentage?: number; // Admin-controlled
  [key: string]: any;
}


export const benefitCategories = [
  'Turismo',
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
  highlight?: string;
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
  isFeatured: boolean; // Admin-controlled
  isVisible: boolean; // Admin or Owner controlled
  featuredRank?: number; // Admin-controlled
  supplierName?: string;
  status?: 'active' | 'inactive';
  stock?: number;
  minLevel?: number;
  isExclusive?: boolean;
  targetAudience?: 'all' | 'level_1' | 'level_2' | 'level_3' | 'cinco_dos';
  linkedProductIds?: string[]; // IDs of delivery products this benefit applies to
  discountAmount?: number; // Optional discount amount in currency
  discountPercentage?: number; // Optional percentage discount
  [key: string]: any;
}

// Serializable type for client-side components
export type SerializableBenefit = Omit<Benefit, 'createdAt' | 'validUntil'> & {
  createdAt: string; // Always a string
  validUntil?: string; // Optional string
  linkedProductIds?: string[];
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
  isVisible?: boolean; // New field
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
    supplierId: string;
    startTime: Date | Timestamp;
    endTime: Date | Timestamp;
    status: 'confirmed' | 'cancelled';
    createdAt: Timestamp;
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
  type: 'perks' | 'delivery';
  [key: string]: any;
}

// Discriminated union for HomeSection.block
type DynamicContentConfig = {
  contentType: "perks" | "suppliers" | "announcements" | "banners" | "benefits_nearby" | "suppliers_nearby" | "delivery_suppliers" | "delivery_products" | "delivery_promos" | "productexmplsupplier" | "minisuppliers" | "supplierpromo";
  mode: "auto" | "manual";
  query?: {
    filters?: WhereFilter[];
    sort?: { field: string; direction: "asc" | "desc" };
    limit?: number;
  };
  items?: string[];
}

export type HomeSectionBlock =
  | (DynamicContentConfig & {
      kind: "carousel";
      layout?: { itemWidth?: number };
    })
  | (DynamicContentConfig & {
      kind: "grid";
      layout?: { gridPreset?: "1x4" | "1x5" | "2x4" | "2x5" };
    })
  | {
      kind: "banner";
      bannerId: string;
    }
    | {
      kind: "categories";
    }
  | {
      kind: "message";
      message: {
        title?: string;
        body: string;
        imageUrl?: string;
        alignment?: 'left' | 'center';
      };
    };

export interface HomeSection {
  id: string;
  title: string;
  order: number;
  isActive: boolean;
  targetBoard: 'perks' | 'delivery';
  createdAt?: Timestamp;
  block: HomeSectionBlock;
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

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'benefit' | 'announcement' | 'appointment';
  referenceId: string; // ID of the benefit, announcement, etc.
  supplierId?: string; // ID of the supplier who triggered it
  target?: 'all' | 'subscribers'; // Who should receive it
  createdAt: Timestamp;
}

/**
 * --- Delivery Lite Models ---
 */

export interface Product {
    id: string;
    supplierId: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number; // Pre-discount price
    imageUrl?: string;
    category?: string; // Global category
    menuSection?: string; // Supplier's custom subcategory
    stockAvailable: boolean;
    isActive: boolean;
    viewsCount?: number;
    salesCount?: number;
    createdAt: Timestamp;
}

export interface OrderItem {
    productId: string;
    name: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    imageUrl?: string;
}

export interface Order {
    id: string;
    userId: string;
    userName: string;
    userPhone: string;
    supplierId: string;
    supplierName: string;
    items: OrderItem[];
    subtotal: number;
    deliveryCost: number;
    totalAmount: number;
    // Payment at Door Structure
    itemsTotal: number;
    serviceFee: number;
    totalPaidOnline: number;
    deliveryFee: number;
    deliveryPaymentStatus: 'pending' | 'paid' | 'not_applicable';
    distanceKm?: number;
    status: 'pending_payment' | 'pending' | 'accepted' | 'shipped' | 'completed' | 'cancelled' | 'searching_rider' | 'assigned' | 'at_store' | 'on_the_way' | 'delivered' | 'paid';
    riderId?: string;
    deliveryAddress?: string;
    deliveryAddressLabel?: string; // "Casa", "Trabajo", etc.
    deliveryNote?: string;
    deliveryPin?: string; // 4-digit code for validation
    type: 'delivery' | 'pickup';
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type SerializableOrder = Omit<Order, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
};

