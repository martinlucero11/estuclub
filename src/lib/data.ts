
import type { Timestamp } from 'firebase/firestore';

// Correctly typed as a tuple for Zod compatibility
export const perkCategories = [
  'Comercios',
  'Eventos',
  'Comida',
  'Educación',
  'Entretenimiento',
] as const;

// The type is now derived from the tuple
export type PerkCategory = typeof perkCategories[number];


export interface Perk {
  id: string;
  title: string;
  description: string;
  category: PerkCategory;
  image: string;
  imageUrl: string;
  location?: string;
  ownerId?: string; // To track which supplier created the benefit
  createdAt?: Timestamp;
  points: number;
  cost?: number; // Cost in points to redeem
  redemptionLimit?: number;
  validUntil?: Timestamp;
  availableDays?: string[];
  redemptionCount?: number;
  active?: boolean;
  isFeatured?: boolean;
}

// Serializable type for client-side components
export type SerializablePerk = Omit<Perk, 'createdAt' | 'validUntil'> & {
  createdAt: string; // Always a string
  validUntil?: string; // Optional string
};

// Function to convert Firestore Timestamps to ISO strings
export function makePerkSerializable(perk: Perk): SerializablePerk {
  return {
    ...perk,
    createdAt: perk.createdAt?.toDate().toISOString() || new Date().toISOString(),
    validUntil: perk.validUntil?.toDate().toISOString(),
  };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorUsername: string;
  createdAt: Timestamp;
  imageUrl?: string;
  linkUrl?: string;
}

export type SerializableAnnouncement = Omit<Announcement, 'createdAt'> & {
  createdAt: string;
};

export function makeAnnouncementSerializable(announcement: Announcement): SerializableAnnouncement {
  return {
    ...announcement,
    createdAt: announcement.createdAt.toDate().toISOString(),
  };
}

export type CarouselItem = (SerializablePerk & { type: 'perk' }) | (SerializableAnnouncement & { type: 'announcement' });

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
}

export interface DaySchedule {
  active: boolean;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export interface Availability {
    schedule: {
        [day: string]: DaySchedule;
    }
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
}

export type SerializableBenefitRedemption = Omit<BenefitRedemption, 'redeemedAt' | 'usedAt'> & {
  redeemedAt: string;
  usedAt?: string;
};

export function makeBenefitRedemptionSerializable(redemption: BenefitRedemption): SerializableBenefitRedemption {
  return {
    ...redemption,
    redeemedAt: redemption.redeemedAt.toDate().toISOString(),
    usedAt: redemption.usedAt?.toDate().toISOString(),
  };
}


export interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
  isActive: boolean;
  colorScheme: 'pink' | 'yellow' | 'blue';
  createdAt: Timestamp;
}

export type SerializableBanner = Omit<Banner, 'createdAt'> & {
  createdAt: string;
};

export function makeBannerSerializable(banner: Banner): SerializableBanner {
  return {
    ...banner,
    createdAt: banner.createdAt?.toDate().toISOString() || new Date().toISOString(),
  };
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  colorClass: string;
  order?: number;
}
