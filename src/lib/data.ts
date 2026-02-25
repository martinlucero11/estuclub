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
    submittedAt: announcement.submittedAt?.toDate().toISOString(),
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
  'single_banner',
  'featured_perks',
  'suppliers_grid',
];
