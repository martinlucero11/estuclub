
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
export type UserRole = 'admin' | 'supplier' | 'cluber' | 'user' | 'rider' | 'rider_pending' | 'cluber_pending' | 'rider_rejected';

/**
 * Represents the data stored for a user in the /users collection.
 */
export interface UserProfile {
    id: string;
    uid: string;
    username: string;
    firstName: string;
    lastName: string;
    displayName?: string;
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
    permitsBenefits?: boolean; // Permiso para crear beneficios (Cluber)
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
    trialEndsAt?: Timestamp;
    membershipPaidUntil?: Timestamp;
    isMembershipWaived?: boolean;
    addresses?: UserAddress[];
    // Real-time Logistics
    isOnline?: boolean;
    lastStatusChange?: Timestamp;
    // Supplier Sync Aliases (Requested Specification)
    storeName?: string;
    address?: string;
    // phone?: string; // Already exists as phone
    description?: string;
    logo?: string;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
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

export const benefitCategories = ['Gastronomía', 'Entretenimiento', 'Deportes', 'Educación', 'Indumentaria', 'Otros'] as const;
export type BenefitCategory = typeof benefitCategories[number];


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
  updatedAt?: Timestamp;
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
  // Specific Specification Aliases
  storeName?: string;
  phone?: string;
  logo?: string;
  isCincoDos?: boolean; // PWA plus membership
  commissionPercentage?: number; // Admin-controlled
  [key: string]: any;
}

export interface Availability {
  schedule: {
    [day: string]: {
      active: boolean;
      startTime: string;
      endTime: string;
    };
  };
}

export interface Product {
    id: string;
    supplierId: string;
    name: string;
    description?: string;
    price: number;
    originalPrice?: number;
    imageUrl?: string;
    category: string; // e.g. 'Comida Rápida' (Global App Category)
    menuSection?: string; // e.g. 'Hamburguesas' (Local Supplier Categories)
    isActive: boolean;
    stockAvailable: boolean;
    order?: number;
    viewsCount?: number;
    salesCount?: number;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    type: 'delivery' | 'discount' | 'global';
    order: number;
    isActive: boolean;
}

export interface Order {
    id: string;
    shortId: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    supplierId: string;
    supplierName: string;
    supplierPhone: string;
    supplierLogo?: string;
    supplierCoords: { latitude: number; longitude: number };
    items: OrderItem[];
    subtotal: number;
    deliveryFee: number;
    deliveryCost?: number; // alias
    total: number;
    status: OrderStatus;
    paymentMethod: 'cash_at_door' | 'mp_link' | 'mp_qr';
    paymentStatus: 'pending' | 'paid' | 'failed';
    deliveryPaymentStatus?: 'pending' | 'paid'; // for door payment
    deliveryAddress: string;
    deliveryNotes?: string;
    deliveryCoords: { latitude: number; longitude: number };
    riderId?: string;
    riderName?: string;
    riderPhone?: string;
    riderLocation?: { latitude: number; longitude: number };
    type: 'delivery' | 'pickup';
    createdAt: Timestamp;
    updatedAt: Timestamp;
    estimatedDeliveryTime?: Timestamp;
}

export interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
}

export type OrderStatus = 
    'pending' | 
    'accepted' |
    'searching_rider' |
    'assigned' | 
    'at_store' | 
    'shipped' |
    'delivered' | 
    'completed' | 
    'cancelled';

export interface Benefit {
    id: string;
    supplierId: string;
    supplierName: string;
    supplierLogo?: string;
    title: string;
    description: string;
    highlight?: string;
    imageUrl: string;
    category: string;
    points?: number;
    redemptionCount?: number;
    isVisible: boolean;
    isFeatured: boolean;
    isExclusive?: boolean;
    // Targeting
    isStudentOnly?: boolean;
    isCincoDosOnly?: boolean;
    minLevel?: number;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

export interface Announcement {
    id: string;
    supplierId: string;
    authorUsername: string;
    title: string;
    content: string;
    imageUrl?: string;
    linkUrl?: string;
    status: 'pending' | 'approved' | 'rejected';
    isVisible: boolean;
    // Targeting
    isStudentOnly?: boolean;
    isCincoDosOnly?: boolean;
    minLevel?: number;
    submittedAt: Timestamp;
    updatedAt?: Timestamp;
    createdAt?: Timestamp; // safety alias
}

export interface Banner {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    link?: string;
    isActive: boolean;
    colorScheme?: 'pink' | 'yellow' | 'blue';
    order?: number;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

export interface HomeSection {
  id: string;
  title?: string;
  isActive: boolean;
  targetBoard: 'perks' | 'delivery';
  block: HomeSectionBlock;
  order: number;
  createdAt: Timestamp;
}

export type HomeSectionBlock = 
  | { kind: 'banner'; bannerId: string }
  | { kind: 'categories' }
  | { kind: 'message'; message: { title?: string; body: string; imageUrl?: string; alignment?: 'left' | 'center' } }
  | { 
      kind: 'carousel' | 'grid'; 
      contentType: "perks" | "suppliers" | "announcements" | "banners" | "delivery_suppliers" | "delivery_products" | "delivery_promos" | "productexmplsupplier" | "minisuppliers" | "supplierpromo" | "benefits_nearby" | "suppliers_nearby";
      mode: 'auto' | 'manual';
      query?: {
        filters?: WhereFilter[];
        sort?: { field: string; direction: 'asc' | 'desc' };
        limit?: number;
      };
      items?: string[];
      layout?: { gridPreset?: string };
    };

// Serializable versions for Next.js SSR/Client boundary if needed
export type SerializableBenefit = Omit<Benefit, 'createdAt' | 'updatedAt'> & {
    createdAt: { seconds: number; nanoseconds: number };
    updatedAt?: { seconds: number; nanoseconds: number };
};

export type SerializableAnnouncement = Omit<Announcement, 'submittedAt' | 'updatedAt' | 'createdAt'> & {
    submittedAt: { seconds: number; nanoseconds: number };
    updatedAt?: { seconds: number; nanoseconds: number };
    createdAt?: { seconds: number; nanoseconds: number };
};
