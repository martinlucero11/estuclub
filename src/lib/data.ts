
import type {
  Announcement,
  Benefit,
  BenefitRedemption,
  SerializableBenefit,
  Banner,
  HomeSection,
  SerializableHomeSection,
  SerializableAnnouncement,
  SerializableBenefitRedemption,
} from '@/types/data';

import { Timestamp } from 'firebase/firestore';

// Announcement serializer
export function makeAnnouncementSerializable(
  announcement: Announcement
): SerializableAnnouncement {
  return {
    ...announcement,
    createdAt: announcement.createdAt
      ? announcement.createdAt.toDate().toISOString()
      : new Date().toISOString(), // Fallback for safety
    submittedAt: announcement.submittedAt
      ? announcement.submittedAt.toDate().toISOString()
      : '',
    approvedAt: announcement.approvedAt
      ? announcement.approvedAt.toDate().toISOString()
      : undefined,
  };
}

// Placeholder banner serializer
export function makeBannerSerializable(banner: Banner) {
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
): SerializableBenefitRedemption {
  return {
    ...redemption,
    redeemedAt: redemption.redeemedAt.toDate().toISOString(),
    usedAt: redemption.usedAt?.toDate().toISOString(),
  };
}

// Function to convert Firestore Timestamps to ISO strings
export function makeBenefitSerializable(benefit: Benefit): SerializableBenefit {
  return {
    ...benefit,
    createdAt: benefit.createdAt?.toDate().toISOString() || new Date().toISOString(),
    validUntil: benefit.validUntil?.toDate().toISOString(),
  };
}

export function makeHomeSectionSerializable(section: HomeSection): SerializableHomeSection {
    return {
        ...section,
        createdAt: section.createdAt?.toDate().toISOString() || new Date().toISOString(),
    };
}
