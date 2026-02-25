export * from '@/types/data';

// ---- Serializers ----

import type {
  Announcement,
  BenefitRedemption
} from '@/types/data';

import { Timestamp } from 'firebase/firestore';

// Announcement serializer
export function makeAnnouncementSerializable(
  announcement: Announcement
) {
  return {
    ...announcement,
    createdAt: announcement.createdAt
      ? announcement.createdAt.toDate().toISOString()
      : undefined,
    submittedAt: announcement.submittedAt
      ? announcement.submittedAt.toDate().toISOString()
      : '',
    approvedAt: announcement.approvedAt
      ? announcement.approvedAt.toDate().toISOString()
      : undefined,
  };
}

// Placeholder banner serializer (ajustar si tienes modelo real)
export function makeBannerSerializable(banner: any) {
  return {
    ...banner,
    createdAt: banner.createdAt instanceof Timestamp
      ? banner.createdAt.toDate().toISOString()
      : banner.createdAt,
  };
}

// Benefit redemption serializer
export function makeBenefitRedemptionSerializable(
  redemption: BenefitRedemption
) {
  return {
    ...redemption,
    redeemedAt: redemption.redeemedAt?.toDate().toISOString(),
  };
}

// Home section types (agrega los que uses realmente)
export const homeSectionTypes = [
  'categories_grid',
  'benefits_carousel',
  'single_banner',
  'suppliers_carousel',
  'announcements_carousel',
  'featured_suppliers_carousel',
  'new_suppliers_carousel',
  'featured_perks',
] as const;
