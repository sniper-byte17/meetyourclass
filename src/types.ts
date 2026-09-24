export type UserRole = 'student' | 'alumni';

export interface StateItem {
  code: string;
  name: string;
}

export interface School {
  id: string; // e.g. 'emory'
  slug: string; // e.g. 'emory'
  name: string;
  shortName: string;
  location: string;
  state: string;
  mascot: string;
  accentColor: string; // Tailwind color class or hex
  badgeBg: string;
  badgeText: string;
  bannerBg: string;
  memberCount: number;
  established: number;
  instagramHandle?: string; // e.g. '@emory2031'
}

export interface Profile {
  id: string;
  schoolId: string;
  name: string;
  role: UserRole;
  gradYear: number;
  major: string;
  currentRole?: string; // e.g., 'Incoming Analyst' or 'Product Designer'
  company?: string; // e.g., 'Deloitte' or 'Emory Healthcare'
  location: string;
  bio: string;
  tags: string[]; // e.g. ['Mentorship', 'Coffee Chats', 'Consulting', 'Pre-Med']
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  email?: string;
  photoUrl: string;
  photoUrls?: string[]; // Up to 10 photos
  createdAt: string;
  isUserSubmission?: boolean;
}

export type PostingSpeedTier = 'instant' | '48hours' | '5days';
export type PaymentMode = 'venmo' | 'zelle' | 'paypal' | 'cashapp';

export interface SpeedTierOption {
  id: PostingSpeedTier;
  title: string;
  timeframe: string;
  price: number;
  badge?: string;
  badgeColor?: string;
  description: string;
  iconType: 'instant' | 'fast' | 'standard';
}

export interface CheckoutSubmissionData {
  school: School;
  name: string;
  instagram: string;
  tiktok?: string;
  gradYear: number;
  major: string;
  hometown: string;
  bio: string;
  photoUrl: string;
  photoUrls?: string[]; // Up to 10 photos
  lookingFor: string;
  tags: string[];
  formattedCaption: string;
}

export interface StudentSubmission {
  id: string;
  school: School;
  name: string;
  instagram: string;
  tiktok?: string;
  gradYear: number;
  major: string;
  hometown: string;
  bio: string;
  lookingFor: string;
  tags: string[];
  photoUrl: string;
  photoUrls?: string[]; // Up to 10 photos
  createdAt: string;
  tier: PostingSpeedTier;
  price: number;
  status: 'queued' | 'approved' | 'posted' | 'rejected';
  paymentStatus: 'paid' | 'pending' | 'free' | 'pending_verification' | 'unverified' | 'rejected';
  paymentMethod: PaymentMode;
  paymentHandle?: string;
  paymentProofType?: 'screenshot' | 'link';
  paymentProofUrl?: string; // base64 receipt screenshot or venmo transaction link
  paymentProofNote?: string;
  paymentVerifiedAt?: string;
  paymentVerifiedBy?: string;
  caption: string;
  queuePosition?: number;
}

export type AdminRole = 'super_admin' | 'campus_manager' | 'moderator';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  assignedSchoolId?: string; // specific campus or 'all'
  addedAt: string;
  addedBy?: string;
  status: 'active' | 'inactive';
}

