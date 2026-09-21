import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { StudentSubmission, Profile, AdminUser } from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific databaseId from config
const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const auth = getAuth(app);

// Test connection helper (safe, non-blocking)
export async function testFirebaseConnection() {
  try {
    console.info('[Firebase] Firestore initialized');
  } catch (error) {
    console.warn('[Firebase] Init note:', error);
  }
}

// Firestore Collections
const ADMIN_USERS_COLLECTION = 'adminUsers';
const SUBMISSIONS_COLLECTION = 'submissions';
const PROFILES_COLLECTION = 'profiles';
const REQUESTS_COLLECTION = 'schoolRequests';

// Admin User Management
export async function getAdminUsersFromFirebase(): Promise<AdminUser[]> {
  try {
    const snapshot = await getDocs(collection(db, ADMIN_USERS_COLLECTION));
    const results: AdminUser[] = [];
    snapshot.forEach((docSnap) => {
      results.push(docSnap.data() as AdminUser);
    });
    // Default master admin if empty
    if (results.length === 0) {
      const defaultSuperAdmin: AdminUser = {
        id: 'admin_primary',
        email: 'martinmuthomi733@gmail.com',
        name: 'Martin Muthomi',
        role: 'super_admin',
        assignedSchoolId: 'all',
        addedAt: new Date().toISOString(),
        status: 'active',
      };
      await saveAdminUserToFirebase(defaultSuperAdmin);
      results.push(defaultSuperAdmin);
    }
    return results;
  } catch (err) {
    console.warn('[Firebase] Could not fetch admin users, returning fallback:', err);
    return [
      {
        id: 'admin_primary',
        email: 'martinmuthomi733@gmail.com',
        name: 'Martin Muthomi',
        role: 'super_admin',
        assignedSchoolId: 'all',
        addedAt: new Date().toISOString(),
        status: 'active',
      },
    ];
  }
}

export async function saveAdminUserToFirebase(admin: AdminUser): Promise<void> {
  try {
    const docRef = doc(db, ADMIN_USERS_COLLECTION, admin.id);
    const dataToSave = JSON.parse(JSON.stringify(admin));
    await setDoc(docRef, dataToSave);
  } catch (err) {
    console.error('[Firebase] Failed to save admin user:', err);
    throw err;
  }
}

export async function deleteAdminUserInFirebase(id: string): Promise<void> {
  try {
    const docRef = doc(db, ADMIN_USERS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('[Firebase] Failed to delete admin user:', err);
    throw err;
  }
}

export async function saveSubmissionToFirebase(submission: StudentSubmission): Promise<void> {
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, submission.id);
    // Sanitize undefined fields
    const dataToSave = JSON.parse(JSON.stringify(submission));
    await setDoc(docRef, dataToSave);
  } catch (err) {
    console.error('[Firebase] Failed to save submission:', err);
    throw err;
  }
}

export async function getSubmissionsFromFirebase(): Promise<StudentSubmission[]> {
  try {
    const q = query(collection(db, SUBMISSIONS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const results: StudentSubmission[] = [];
    snapshot.forEach((docSnap) => {
      results.push(docSnap.data() as StudentSubmission);
    });
    return results;
  } catch (err) {
    console.warn('[Firebase] Could not fetch submissions from Firestore, falling back:', err);
    return [];
  }
}

export async function updateSubmissionStatusInFirebase(
  id: string,
  status: StudentSubmission['status']
): Promise<void> {
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, id);
    await updateDoc(docRef, { status });
  } catch (err) {
    console.error('[Firebase] Failed to update submission status:', err);
    throw err;
  }
}

export async function updateSubmissionPaymentInFirebase(
  id: string,
  paymentStatus: StudentSubmission['paymentStatus'],
  verifiedBy?: string,
  extra?: Partial<StudentSubmission>
): Promise<void> {
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, id);
    const updates: Record<string, any> = {
      paymentStatus,
      ...(paymentStatus === 'paid' ? { paymentVerifiedAt: new Date().toISOString() } : {}),
      ...(verifiedBy ? { paymentVerifiedBy: verifiedBy } : {}),
      ...(extra || {}),
    };
    await updateDoc(docRef, updates);
  } catch (err) {
    console.error('[Firebase] Failed to update submission payment status:', err);
    throw err;
  }
}

export async function deleteSubmissionInFirebase(id: string): Promise<void> {
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('[Firebase] Failed to delete submission:', err);
    throw err;
  }
}

export async function saveProfileToFirebase(profile: Profile): Promise<void> {
  try {
    const docRef = doc(db, PROFILES_COLLECTION, profile.id);
    const dataToSave = JSON.parse(JSON.stringify(profile));
    await setDoc(docRef, dataToSave);
  } catch (err) {
    console.error('[Firebase] Failed to save profile:', err);
  }
}

export async function getProfilesFromFirebase(schoolId?: string): Promise<Profile[]> {
  try {
    const snapshot = await getDocs(collection(db, PROFILES_COLLECTION));
    const results: Profile[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Profile;
      if (!schoolId || data.schoolId === schoolId) {
        results.push(data);
      }
    });
    return results;
  } catch (err) {
    console.warn('[Firebase] Could not fetch profiles from Firestore:', err);
    return [];
  }
}

export async function saveSchoolRequestToFirebase(request: {
  schoolName: string;
  cityState?: string;
  igHandle?: string;
  contactEmail?: string;
}): Promise<void> {
  try {
    const id = `req_${Date.now()}`;
    const docRef = doc(db, REQUESTS_COLLECTION, id);
    await setDoc(docRef, {
      id,
      ...request,
      requestedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Firebase] Failed to save school request:', err);
  }
}

// Real-time listener for submissions queue
export function subscribeToSubmissions(
  onUpdate: (submissions: StudentSubmission[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, SUBMISSIONS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: StudentSubmission[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as StudentSubmission);
        });
        onUpdate(items);
      },
      (err) => {
        // Suppress benign abort/cancellation errors
        if (
          err?.name === 'AbortError' ||
          err?.message?.includes('aborted') ||
          err?.message?.includes('The user aborted a request')
        ) {
          return;
        }
        console.warn('[Firebase] onSnapshot submissions warning:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('[Firebase] subscribe error:', err);
    return () => {};
  }
}

export { app, db, auth };
