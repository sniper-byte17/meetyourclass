import { School, Profile, StudentSubmission, PostingSpeedTier, PaymentMode } from '../src/types';
import { INITIAL_SCHOOLS, INITIAL_PROFILES } from '../src/data/schoolsData';

export interface PaymentVerificationRecord {
  id: string;
  submissionId: string;
  studentName: string;
  studentHandle: string;
  schoolId: string;
  tier: PostingSpeedTier;
  amount: number;
  paymentMode: PaymentMode;
  payerHandleOrMemo: string;
  transactionRef: string;
  verifiedAt: string;
  status: 'verified' | 'pending_manual_review';
  estimatedPostTime: string;
}

export interface AdminMetrics {
  totalSchools: number;
  totalSubmissions: number;
  pendingQueue: number;
  approvedCount: number;
  postedCount: number;
  verifiedRevenue: number;
  activeCampusesCount: number;
}

class StorageManager {
  private schools: School[] = [];
  private profiles: Profile[] = [];
  private submissions: StudentSubmission[] = [];
  private payments: PaymentVerificationRecord[] = [];
  private schoolRequests: Array<{ id: string; schoolName: string; cityState?: string; igHandle?: string; requestedAt: string; contactEmail?: string }> = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    this.schools = [...INITIAL_SCHOOLS];
    this.profiles = [...INITIAL_PROFILES];

    // Seed a few initial student submissions to populate the live admin queue
    const sampleSubmissions: StudentSubmission[] = [
      {
        id: 'sub_sample_1',
        school: this.schools.find((s) => s.id === 'emory') || this.schools[0],
        name: 'Jordan Miller',
        instagram: 'jordan.miller27',
        tiktok: 'jordanm_college',
        gradYear: 2029,
        major: 'Neuroscience & Behavioral Biology',
        hometown: 'Atlanta, GA',
        bio: 'Pre-med freshman! Looking for roommates on Freshman Quad and workout buddies.',
        lookingFor: 'Roommate & new friends',
        tags: ['Pre-Med', 'Fitness & Gym', 'Coffee Lover', 'Research'],
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        tier: 'instant',
        price: 10,
        status: 'queued',
        paymentStatus: 'paid',
        paymentMethod: 'cashapp',
        paymentHandle: '$jordanm',
        caption: 'Meet Jordan Miller (@jordan.miller27) – Emory University Class of 2029! 🦅💙',
      },
      {
        id: 'sub_sample_2',
        school: this.schools.find((s) => s.id === 'uga') || this.schools[1],
        name: 'Marcus Vance',
        instagram: 'marcus_vance',
        tiktok: 'marcusv_uga',
        gradYear: 2029,
        major: 'Finance & Real Estate',
        hometown: 'Savannah, GA',
        bio: 'Terry College of Business bound. Huge Bulldogs fan, looking for roommates near Russell Hall!',
        lookingFor: 'Roommate & social circle',
        tags: ['Business & Finance', 'Greek Life', 'Dawgs Football', 'Intramural Sports'],
        photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        tier: '48hours',
        price: 7,
        status: 'queued',
        paymentStatus: 'paid',
        paymentMethod: 'venmo',
        paymentHandle: '@marcus-vance',
        caption: 'Meet Marcus Vance (@marcus_vance) – University of Georgia Class of 2029! 🐾❤️',
      },
    ];

    this.submissions = sampleSubmissions;
  }

  // Schools
  getSchools(search?: string, state?: string): School[] {
    let result = [...this.schools];
    if (state && state !== 'all') {
      result = result.filter((s) => (s.state || '').toLowerCase() === state.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.shortName || '').toLowerCase().includes(q) ||
          (s.state || '').toLowerCase().includes(q) ||
          (s.location || '').toLowerCase().includes(q) ||
          Boolean(s.instagramHandle && s.instagramHandle.toLowerCase().includes(q))
      );
    }
    return result;
  }

  getSchoolById(id: string): School | undefined {
    return this.schools.find((s) => s.id === id);
  }

  requestSchool(request: { schoolName: string; cityState?: string; igHandle?: string; contactEmail?: string }) {
    const entry = {
      id: `req_${Date.now()}`,
      ...request,
      requestedAt: new Date().toISOString(),
    };
    this.schoolRequests.unshift(entry);
    return entry;
  }

  // Submissions
  getSubmissions(schoolId?: string, status?: string): StudentSubmission[] {
    let result = [...this.submissions];
    if (schoolId) {
      result = result.filter((s) => s.school.id === schoolId);
    }
    if (status) {
      result = result.filter((s) => s.status === status);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createSubmission(data: Partial<StudentSubmission>): StudentSubmission {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const school = data.school || this.schools[0];
    const newSubmission: StudentSubmission = {
      id,
      school,
      name: data.name || 'Anonymous Student',
      instagram: (data.instagram || '').replace('@', ''),
      tiktok: data.tiktok ? data.tiktok.replace('@', '') : undefined,
      gradYear: data.gradYear || 2029,
      major: data.major || 'Undeclared',
      hometown: data.hometown || 'Campus',
      bio: data.bio || '',
      lookingFor: data.lookingFor || 'Roommate & new friends',
      tags: data.tags || ['Classmate'],
      photoUrl: data.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString(),
      tier: data.tier || 'instant',
      price: data.price ?? (data.tier === 'instant' ? 10 : data.tier === '48hours' ? 7 : 5),
      status: 'queued',
      paymentStatus: data.paymentStatus || 'paid',
      paymentMethod: data.paymentMethod || 'cashapp',
      paymentHandle: data.paymentHandle || '',
      caption: data.caption || `Welcome to ${school.name}!`,
    };

    this.submissions.unshift(newSubmission);

    // Also sync to active networking profiles
    const newProfile: Profile = {
      id: `prof_${id}`,
      schoolId: school.id,
      name: newSubmission.name,
      role: 'student',
      gradYear: newSubmission.gradYear,
      major: newSubmission.major,
      location: newSubmission.hometown,
      bio: newSubmission.bio,
      tags: newSubmission.tags,
      instagram: newSubmission.instagram,
      tiktok: newSubmission.tiktok,
      photoUrl: newSubmission.photoUrl,
      createdAt: new Date().toISOString().split('T')[0],
      isUserSubmission: true,
    };
    this.profiles.unshift(newProfile);

    // Increment school member count
    const schoolIndex = this.schools.findIndex((s) => s.id === school.id);
    if (schoolIndex !== -1) {
      this.schools[schoolIndex] = {
        ...this.schools[schoolIndex],
        memberCount: (this.schools[schoolIndex].memberCount || 0) + 1,
      };
    }

    return newSubmission;
  }

  updateSubmissionStatus(id: string, status: StudentSubmission['status']): StudentSubmission | null {
    const index = this.submissions.findIndex((s) => s.id === id);
    if (index === -1) return null;
    this.submissions[index] = {
      ...this.submissions[index],
      status,
    };
    return this.submissions[index];
  }

  deleteSubmission(id: string): boolean {
    const initialLen = this.submissions.length;
    this.submissions = this.submissions.filter((s) => s.id !== id);
    return this.submissions.length < initialLen;
  }

  // Profiles
  getProfiles(schoolId?: string, search?: string): Profile[] {
    let result = [...this.profiles];
    if (schoolId) {
      result = result.filter((p) => p.schoolId === schoolId);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.major.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          (p.bio && p.bio.toLowerCase().includes(q)) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }

  createProfile(profile: Partial<Profile>): Profile {
    const id = `prof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newProf: Profile = {
      id,
      schoolId: profile.schoolId || 'emory',
      name: profile.name || 'Student',
      role: profile.role || 'student',
      gradYear: profile.gradYear || 2029,
      major: profile.major || 'Undeclared',
      location: profile.location || 'Campus',
      bio: profile.bio || '',
      tags: profile.tags || ['Classmate'],
      instagram: profile.instagram,
      tiktok: profile.tiktok,
      linkedin: profile.linkedin,
      email: profile.email,
      photoUrl: profile.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString().split('T')[0],
      isUserSubmission: true,
    };
    this.profiles.unshift(newProf);
    return newProf;
  }

  // Payment Verification
  verifyPayment(data: {
    submissionId: string;
    studentName: string;
    studentHandle: string;
    schoolId: string;
    tier: PostingSpeedTier;
    amount: number;
    paymentMode: PaymentMode;
    payerHandleOrMemo: string;
  }): PaymentVerificationRecord {
    const id = `pay_${Date.now()}`;
    const hours = data.tier === 'instant' ? 1 : data.tier === '48hours' ? 48 : 120;
    const estTime = new Date(Date.now() + hours * 3600000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const record: PaymentVerificationRecord = {
      id,
      submissionId: data.submissionId,
      studentName: data.studentName,
      studentHandle: data.studentHandle,
      schoolId: data.schoolId,
      tier: data.tier,
      amount: data.amount,
      paymentMode: data.paymentMode,
      payerHandleOrMemo: data.payerHandleOrMemo,
      transactionRef: `MFC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      verifiedAt: new Date().toISOString(),
      status: 'verified',
      estimatedPostTime: estTime,
    };

    this.payments.unshift(record);
    return record;
  }

  // Admin Metrics
  getAdminMetrics(): AdminMetrics {
    const totalSubmissions = this.submissions.length;
    const pendingQueue = this.submissions.filter((s) => s.status === 'queued').length;
    const approvedCount = this.submissions.filter((s) => s.status === 'approved').length;
    const postedCount = this.submissions.filter((s) => s.status === 'posted').length;
    const verifiedRevenue = this.submissions.reduce((acc, s) => acc + (s.price || 0), 0);

    return {
      totalSchools: this.schools.length,
      totalSubmissions,
      pendingQueue,
      approvedCount,
      postedCount,
      verifiedRevenue,
      activeCampusesCount: new Set(this.submissions.map((s) => s.school.id)).size,
    };
  }
}

export const storage = new StorageManager();
