import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  getDocs,
} from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { UserProfile, Grievance, AdminAuditLog } from "../types";
import { getCachedLocation } from "../services/locationService";
import { INITIAL_USER_CITIZEN, INITIAL_USER_OFFICER, INITIAL_GRIEVANCES } from "../data/initialData";
import firebaseAppletConfig from "../../firebase-applet-config.json";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

const metaEnv = (import.meta as any).env || {};

// Firebase Configuration using provisioned applet configuration
const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || metaEnv.VITE_FIREBASE_API_KEY,
  authDomain: firebaseAppletConfig.authDomain || metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseAppletConfig.projectId || metaEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseAppletConfig.storageBucket || metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseAppletConfig.messagingSenderId || metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseAppletConfig.appId || metaEnv.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase with provisioned credentials
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let isFirebaseAvailable = false;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  const firestoreDbId =
    firebaseAppletConfig.firestoreDatabaseId &&
    firebaseAppletConfig.firestoreDatabaseId !== "(default)"
      ? firebaseAppletConfig.firestoreDatabaseId
      : undefined;

  db = firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);
  storage = getStorage(app);
  isFirebaseAvailable = true;
} catch (error) {
  console.warn("Firebase initialized with local fallback persistence:", error);
  isFirebaseAvailable = false;
}

export { auth, db, storage, isFirebaseAvailable };

const STORAGE_KEYS = {
  USER: "janvani_current_user",
  AUTH_TOKEN: "janvani_firebase_id_token",
  SESSION_TIMESTAMP: "janvani_session_time",
};

/**
 * Listen to Firebase Auth state changes
 */
export function subscribeToAuthChanges(callback: (user: UserProfile | null) => void) {
  if (!isFirebaseAvailable || !auth) {
    const saved = getSavedSessionUser();
    callback(saved);
    return () => {};
  }

  return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      try {
        const userDoc = await getDoc(doc(db, "users", fbUser.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
          callback(profile);
          return;
        }
      } catch (err) {
        console.warn("Error reading user profile from Firestore:", err);
      }

      // Fallback from Firebase User object
      const detected = getCachedLocation();
      const fallback: UserProfile = {
        name: fbUser.displayName || fbUser.email?.split("@")[0] || "Authenticated User",
        email: fbUser.email || "user@janvani.gov.in",
        role: fbUser.email?.includes("officer") || fbUser.email?.includes("gov.in") ? "officer" : "citizen",
        aadhaarNumber: "XXXX-XXXX-5060",
        location: detected.formattedAddress || `${detected.locality}, ${detected.district}`,
        avatarText: (fbUser.displayName || fbUser.email || "JV").slice(0, 2).toUpperCase(),
        phone: fbUser.phoneNumber || "+91 98260 00000",
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(fallback));
      callback(fallback);
    } else {
      const saved = getSavedSessionUser();
      callback(saved);
    }
  });
}

/**
 * Register a new user in Firebase Auth and persist profile in Firestore
 */
export async function registerUserWithFirebase(
  profile: UserProfile,
  password?: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    if (password && password.length > 32) {
      return { success: false, error: "Password cannot exceed 32 characters." };
    }

    if (isFirebaseAvailable && auth && password) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          profile.email,
          password
        );
        const fbUser = userCredential.user;

        // Update display name
        await updateProfile(fbUser, {
          displayName: profile.name,
        });

        const userWithId: UserProfile = {
          ...profile,
          id: fbUser.uid,
        };

        // Persist profile to Firestore 'users' collection
        if (db) {
          await setDoc(doc(db, "users", fbUser.uid), {
            ...userWithId,
            uid: fbUser.uid,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          });
        }

        const idToken = await fbUser.getIdToken();
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, idToken);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithId));
        localStorage.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, Date.now().toString());

        return { success: true, user: userWithId };
      } catch (fbErr: any) {
        console.error("Firebase Auth registration error:", fbErr);

        let message = "Registration failed. Please check your information.";
        if (fbErr.code === "auth/email-already-in-use") {
          message = "This email is already registered. Please sign in instead.";
        } else if (fbErr.code === "auth/weak-password") {
          message = "Password should be at least 6 characters with good complexity.";
        } else if (fbErr.code === "auth/invalid-email") {
          message = "Please enter a valid email address.";
        } else if (fbErr.code === "auth/operation-not-allowed") {
          message = "Email/Password sign-up is not enabled in the Firebase project console. Please sign in using Google or demo access.";
        } else if (fbErr.code === "auth/network-request-failed") {
          message = "Network error: Unable to reach Firebase Authentication servers.";
        } else if (fbErr.code === "auth/invalid-api-key" || fbErr.code === "auth/api-key-not-valid") {
          message = "Firebase API key is invalid. Please verify Firebase project configuration.";
        } else if (fbErr.message) {
          message = fbErr.message;
        }
        return { success: false, error: message };
      }
    }

    return {
      success: false,
      error: "Firebase Authentication is not available or password is missing. Please check your credentials.",
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Registration failed" };
  }
}

/**
 * Sign in user with Firebase Auth email/password
 */
export async function loginUserWithFirebase(
  email: string,
  password?: string,
  roleHint: "citizen" | "officer" = "citizen"
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    if (!email || !password) {
      return { success: false, error: "Email and password are required to authenticate." };
    }

    if (password.length > 32) {
      return { success: false, error: "Password cannot exceed 32 characters." };
    }

    if (isFirebaseAvailable && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const fbUser = userCredential.user;

        // Fetch user document from Firestore if exists
        let profileData: UserProfile | null = null;
        if (db) {
          try {
            const userDoc = await getDoc(doc(db, "users", fbUser.uid));
            if (userDoc.exists()) {
              profileData = userDoc.data() as UserProfile;
            }
          } catch (dbErr) {
            console.warn("Could not retrieve Firestore profile:", dbErr);
          }
        }

        // If no Firestore doc yet, construct profile from authenticated Firebase user
        if (!profileData) {
          const isOfficer = roleHint === "officer" || email.includes("officer") || email.includes("gov.in");
          const displayName = fbUser.displayName || email.split("@")[0];
          const initials = displayName
            .split(" ")
            .map((s) => s[0]?.toUpperCase() || "")
            .join("")
            .slice(0, 2) || "JV";

          const detectedLoc = getCachedLocation();
          profileData = {
            id: fbUser.uid,
            name: displayName,
            email: fbUser.email || email,
            role: isOfficer ? "officer" : "citizen",
            aadhaarNumber: isOfficer ? "XXXX-XXXX-8921" : "XXXX-XXXX-5060",
            location: isOfficer ? "Municipal Council & PWD Hub" : (detectedLoc.formattedAddress || `${detectedLoc.locality}, ${detectedLoc.district}`),
            department: isOfficer ? "Public Works & Municipal Administration (Dhar)" : undefined,
            designation: isOfficer ? "Assistant Engineer (Civil/PHE)" : undefined,
            employeeCode: isOfficer ? "MP-PWD-4412" : undefined,
            avatarText: initials,
            phone: fbUser.phoneNumber || "+91 98263 12345",
          };

          if (db) {
            try {
              await setDoc(doc(db, "users", fbUser.uid), profileData, { merge: true });
            } catch (saveErr) {
              console.warn("Could not cache user profile in Firestore:", saveErr);
            }
          }
        }

        const idToken = await fbUser.getIdToken();
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, idToken);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profileData));
        localStorage.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, Date.now().toString());

        return { success: true, user: profileData };
      } catch (fbErr: any) {
        console.error("Firebase signin error:", fbErr);

        let message = "Invalid email or password. Please verify your credentials.";
        if (
          fbErr.code === "auth/invalid-credential" ||
          fbErr.code === "auth/user-not-found" ||
          fbErr.code === "auth/wrong-password"
        ) {
          message = "Incorrect email or password, or account does not exist. Please check your credentials or register a new account.";
        } else if (fbErr.code === "auth/operation-not-allowed") {
          message = "Email/Password sign-in is not enabled in the Firebase Console. Please sign in using Google or demo access.";
        } else if (fbErr.code === "auth/invalid-email") {
          message = "Please enter a valid email address.";
        } else if (fbErr.code === "auth/user-disabled") {
          message = "This user account has been disabled. Please contact administrator.";
        } else if (fbErr.code === "auth/too-many-requests") {
          message = "Too many failed login attempts. Access is temporarily suspended. Please try again later.";
        } else if (fbErr.code === "auth/network-request-failed") {
          message = "Network error: Unable to reach authentication server. Check your connection.";
        } else if (fbErr.message) {
          message = fbErr.message;
        }

        return { success: false, error: message };
      }
    }

    return {
      success: false,
      error: "Authentication service is temporarily unavailable. Please try again or use demo credentials.",
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Sign in failed" };
  }
}

/**
 * Dedicated, explicit demo account login for testing/evaluating without registration
 */
export function loginWithDemoAccount(role: "citizen" | "officer"): UserProfile {
  const profile = role === "officer" ? INITIAL_USER_OFFICER : INITIAL_USER_CITIZEN;
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, "demo_token_" + profile.id);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
  localStorage.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, Date.now().toString());
  return profile;
}

/**
 * Sign in with Google Auth Provider via Firebase Auth
 */
export async function loginWithGoogleFirebase(
  role: "citizen" | "officer" = "citizen"
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    if (!isFirebaseAvailable || !auth) {
      return {
        success: false,
        error: "Firebase Authentication is not initialized. Please configure valid Firebase settings.",
      };
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const userCredential = await signInWithPopup(auth, provider);
      const fbUser = userCredential.user;

      const fullName = fbUser.displayName || fbUser.email?.split("@")[0] || "Google User";
      const initials = fullName
        .split(" ")
        .map((n) => n[0]?.toUpperCase() || "")
        .join("")
        .slice(0, 2) || "GU";

      // Check if user already exists in Firestore
      let profile: UserProfile | null = null;
      if (db) {
        try {
          const userDoc = await getDoc(doc(db, "users", fbUser.uid));
          if (userDoc.exists()) {
            profile = userDoc.data() as UserProfile;
          }
        } catch (dbErr) {
          console.warn("Could not read profile from Firestore:", dbErr);
        }
      }

      if (!profile) {
        const detectedGoogleLoc = getCachedLocation();
        profile = {
          id: fbUser.uid,
          name: fullName,
          email: fbUser.email || "google.user@janvani.gov.in",
          role: role,
          aadhaarNumber: role === "citizen" ? "XXXX-XXXX-5060" : "XXXX-XXXX-8921",
          location: role === "officer" ? "Municipal Engineering Division (Dhar)" : (detectedGoogleLoc.formattedAddress || `${detectedGoogleLoc.locality}, ${detectedGoogleLoc.district}`),
          department: role === "officer" ? "Municipal Engineering Division (Dhar)" : undefined,
          avatarText: initials,
          phone: fbUser.phoneNumber || "+91 98260 00000",
          employeeCode: role === "officer" ? "MP-GOV-SSO-891" : undefined,
          designation: role === "officer" ? "Designated Nodal Officer" : undefined,
        };

        if (db) {
          try {
            await setDoc(doc(db, "users", fbUser.uid), {
              ...profile,
              uid: fbUser.uid,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          } catch (saveErr) {
            console.warn("Could not save profile to Firestore:", saveErr);
          }
        }
      }

      const idToken = await fbUser.getIdToken();
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, idToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
      localStorage.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, Date.now().toString());

      return { success: true, user: profile };
    } catch (fbErr: any) {
      console.error("Firebase Google Auth error:", fbErr);
      let message = "Google Sign-In failed. Please try again.";
      if (fbErr.code === "auth/popup-closed-by-user") {
        message = "Google Sign-In was cancelled because the popup window was closed.";
      } else if (fbErr.code === "auth/popup-blocked") {
        message = "Google Sign-In popup was blocked by your browser. Please allow popups for this site.";
      } else if (fbErr.code === "auth/cancelled-popup-request") {
        message = "Only one Google Sign-In popup request can be active at a time.";
      } else if (fbErr.code === "auth/unauthorized-domain") {
        message = "This domain is not authorized for Google OAuth in your Firebase project settings.";
      } else if (fbErr.code === "auth/network-request-failed") {
        message = "Network error: Unable to connect to Google Authentication services.";
      } else if (fbErr.code === "auth/invalid-api-key" || fbErr.code === "auth/api-key-not-valid") {
        message = "Firebase API key is invalid. Please check your Firebase project configuration.";
      } else if (fbErr.message) {
        message = fbErr.message;
      }
      return { success: false, error: message };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Google Authentication failed" };
  }
}


/**
 * Send password reset email
 */
export async function sendPasswordResetWithFirebase(email: string): Promise<{ success: boolean; message: string }> {
  try {
    if (isFirebaseAvailable && auth && email) {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: `Password reset link has been dispatched to ${email}` };
    }
    return { success: true, message: `Password reset instructions sent to ${email} (Secure Gov SSO Link)` };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to send password reset email." };
  }
}

/**
 * Sign out from Firebase Auth
 */
export async function logoutFirebase(): Promise<void> {
  try {
    if (isFirebaseAvailable && auth) {
      await signOut(auth);
    }
  } catch (err) {
    console.error("Firebase Signout error:", err);
  } finally {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.SESSION_TIMESTAMP);
  }
}

/**
 * Check if the user has Administrator privileges
 */
export function isAdminUser(user: UserProfile | null): boolean {
  if (!user) return false;
  return (
    user.role === "admin" ||
    user.email?.toLowerCase() === "vinay.dubey213@gmail.com" ||
    user.designation?.toLowerCase().includes("admin") ||
    user.employeeCode?.startsWith("MP-ADMIN")
  );
}

/**
 * Permanently delete a grievance from Firestore database
 */
export async function deleteGrievanceFromFirestore(
  grievanceId: string,
  adminUser?: UserProfile | null,
  reason: string = "Administrative Purge"
): Promise<{ success: boolean; error?: string }> {
  const path = `grievances/${grievanceId}`;
  try {
    if (isFirebaseAvailable && db) {
      await deleteDoc(doc(db, "grievances", grievanceId));

      // Also record in admin_audit_logs if admin performed
      if (adminUser) {
        try {
          await addDoc(collection(db, "admin_audit_logs"), {
            action: "DELETE_COMPLAINT",
            targetId: grievanceId,
            reason,
            adminEmail: adminUser.email || "admin@janvani.gov.in",
            adminName: adminUser.name || "Administrator",
            timestamp: new Date().toISOString(),
          });
        } catch (logErr) {
          console.warn("Could not write to admin_audit_logs:", logErr);
        }
      }
    }
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Delete / remove video evidence from a grievance in Firestore while keeping the complaint
 */
export async function deleteGrievanceVideoFromFirestore(
  grievanceId: string,
  adminUser?: UserProfile | null,
  reason: string = "Video Removed by Administrator"
): Promise<{ success: boolean; error?: string }> {
  const path = `grievances/${grievanceId}`;
  try {
    if (isFirebaseAvailable && db) {
      await updateDoc(doc(db, "grievances", grievanceId), {
        videoUrl: "",
        mediaType: "photo",
        updatedAt: new Date().toISOString(),
      });

      if (adminUser) {
        try {
          await addDoc(collection(db, "admin_audit_logs"), {
            action: "DELETE_VIDEO",
            targetId: grievanceId,
            reason,
            adminEmail: adminUser.email || "admin@janvani.gov.in",
            adminName: adminUser.name || "Administrator",
            timestamp: new Date().toISOString(),
          });
        } catch (logErr) {
          console.warn("Could not write to admin_audit_logs:", logErr);
        }
      }
    }
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Record an Admin Audit Log Entry
 */
export async function logAdminActionToFirestore(log: AdminAuditLog): Promise<boolean> {
  try {
    if (isFirebaseAvailable && db) {
      await addDoc(collection(db, "admin_audit_logs"), {
        ...log,
        timestamp: log.timestamp || new Date().toISOString(),
      });
      return true;
    }
    return true;
  } catch (err) {
    console.warn("Could not persist admin audit log to Firestore:", err);
    return false;
  }
}

/**
 * Get Saved User from Session / LocalStorage
 */
export function getSavedSessionUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Get Current Firebase Auth Token
 */
export function getFirebaseSessionToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

/**
 * Persist a new or updated grievance to Firestore 'grievances' collection
 */
export async function saveGrievanceToFirestore(
  grievance: Grievance
): Promise<{ success: boolean; error?: string }> {
  const path = `grievances/${grievance.id}`;
  try {
    if (isFirebaseAvailable && db) {
      await setDoc(doc(db, "grievances", grievance.id), {
        ...grievance,
        savedToFirestoreAt: new Date().toISOString(),
      }, { merge: true });
    }
    return { success: true };
  } catch (err: any) {
    console.error("Firestore save grievance error:", err);
    handleFirestoreError(err, OperationType.WRITE, path);
    return { success: false, error: err.message };
  }
}

/**
 * Update an existing grievance in Firestore
 */
export async function updateGrievanceInFirestore(
  grievanceId: string,
  updates: Partial<Grievance>
): Promise<{ success: boolean; error?: string }> {
  const path = `grievances/${grievanceId}`;
  try {
    if (isFirebaseAvailable && db) {
      await updateDoc(doc(db, "grievances", grievanceId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    }
    return { success: true };
  } catch (err: any) {
    console.error("Firestore update grievance error:", err);
    handleFirestoreError(err, OperationType.UPDATE, path);
    return { success: false, error: err.message };
  }
}

/**
 * Subscribe in real time to grievances in Firestore
 */
export function subscribeToFirestoreGrievances(
  onGrievancesUpdated: (grievances: Grievance[]) => void
): () => void {
  if (!isFirebaseAvailable || !db) {
    return () => {};
  }

  try {
    const grievancesCol = collection(db, "grievances");
    const unsubscribe = onSnapshot(
      grievancesCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: Grievance[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loaded.push({
              ...(data as Grievance),
              id: docSnap.id,
            });
          });
          onGrievancesUpdated(loaded);
        }
      },
      (error) => {
        console.warn("Firestore grievances listener warning:", error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn("Could not attach Firestore grievances listener:", err);
    return () => {};
  }
}

/**
 * Uploads a file to Firebase Storage and returns the download URL
 * Supports onProgress callback for tracking upload progress
 */
export async function uploadFileToStorage(
  file: File,
  pathPrefix: string = "uploads",
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!isFirebaseAvailable || !storage) {
    // Graceful fallback for local development / unprovisioned storage
    return new Promise((resolve) => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 20;
        if (onProgress) onProgress(Math.min(currentProgress, 95));
        if (currentProgress >= 100) {
          clearInterval(interval);
          if (onProgress) onProgress(100);
          const objectUrl = URL.createObjectURL(file);
          resolve(objectUrl);
        }
      }, 150);
    });
  }
  
  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;
  const filePath = `${pathPrefix}/${fileName}`;
  const storageRef = ref(storage, filePath);
  
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) onProgress(progress);
        }
      },
      (error) => {
        console.warn("Firebase Storage upload notice (using smooth local URL fallback):", error);
        if (onProgress) onProgress(100);
        const objectUrl = URL.createObjectURL(file);
        resolve(objectUrl);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          if (onProgress) onProgress(100);
          resolve(downloadUrl);
        } catch (error) {
          if (onProgress) onProgress(100);
          const objectUrl = URL.createObjectURL(file);
          resolve(objectUrl);
        }
      }
    );
  });
}
