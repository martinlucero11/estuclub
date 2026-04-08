
import type {
  Announcement,
  Benefit,
  BenefitRedemption,
  SerializableBenefit,
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
    createdAt: (announcement.createdAt instanceof Timestamp)
      ? announcement.createdAt.toDate().toISOString()
      : (announcement.createdAt || new Date().toISOString()),
    submittedAt: (announcement.submittedAt instanceof Timestamp)
      ? announcement.submittedAt.toDate().toISOString()
      : (announcement.submittedAt || ''),
    approvedAt: (announcement.approvedAt instanceof Timestamp)
      ? announcement.approvedAt.toDate().toISOString()
      : (announcement.approvedAt || undefined),
    updatedAt: (announcement.updatedAt instanceof Timestamp)
      ? announcement.updatedAt.toDate().toISOString()
      : (announcement.updatedAt || undefined),
  };
}

// Redemption serializer
export function makeRedemptionSerializable(
  redemption: BenefitRedemption
): SerializableBenefitRedemption {
  return {
    ...redemption,
    redeemedAt: (redemption.redeemedAt instanceof Timestamp) 
      ? redemption.redeemedAt.toDate().toISOString() 
      : redemption.redeemedAt,
    usedAt: (redemption.usedAt instanceof Timestamp)
      ? redemption.usedAt.toDate().toISOString()
      : redemption.usedAt,
  };
}

// Function to convert Firestore Timestamps to ISO strings
export function makeBenefitSerializable(benefit: Benefit): SerializableBenefit {
  return {
    ...benefit,
    createdAt: (benefit.createdAt instanceof Timestamp)
      ? benefit.createdAt.toDate().toISOString()
      : (benefit.createdAt || new Date().toISOString()),
    validUntil: (benefit.validUntil instanceof Timestamp)
      ? benefit.validUntil.toDate().toISOString()
      : benefit.validUntil,
    updatedAt: (benefit.updatedAt instanceof Timestamp)
      ? benefit.updatedAt.toDate().toISOString()
      : (benefit.updatedAt || undefined),
  };
}

export function makeHomeSectionSerializable(section: HomeSection): SerializableHomeSection {
    return {
        ...section,
        createdAt: section.createdAt?.toDate().toISOString() || new Date().toISOString(),
    };
}

