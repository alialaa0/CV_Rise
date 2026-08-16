import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase";

export const ADMIN_EMAILS = [
  "alialaaaou@gmail.com",
  "ali@cvrise.com",
  "mahmoud@cvrise.com",
  "hazem@cvrise.com",
  "mo@cvrise.com",
];

/**
 * Sign in admin using email and password
 */
export async function loginAdmin(email, password) {
  const cleanEmail = email.trim();
  const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
  const user = userCredential.user;
  const isAuthorized = await verifyAdminClaim(user);
  return { user, isAuthorized };
}

/**
 * Sign out current admin session
 */
export async function logoutAdmin() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Sign out error:", err);
  }
}

/**
 * Subscribe to Firebase Auth state transitions
 */
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({ user: null, isAuthorized: false, loading: false });
      return;
    }

    try {
      const isAuthorized = await verifyAdminClaim(user);
      callback({ user, isAuthorized, loading: false });
    } catch (err) {
      console.error("Failed to verify admin authorization claims:", err);
      callback({ user, isAuthorized: false, loading: false });
    }
  });
}

/**
 * Verify Administrator Authorization
 * Checks:
 * 1. Server-enforced Firebase Custom Claim (admin: true) via forced token refresh
 * 2. Authorized admin email list
 */
export async function verifyAdminClaim(user) {
  if (!user || !user.email) return false;

  try {
    // Force token refresh to fetch latest custom claims from Firebase Auth
    const tokenResult = await user.getIdTokenResult(true);
    const hasAdminClaim = tokenResult.claims?.admin === true;

    const userEmail = user.email.trim().toLowerCase();
    const isAllowlisted = ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(userEmail);

    return hasAdminClaim || isAllowlisted;
  } catch (err) {
    console.error("Token verification error:", err);
    return false;
  }
}
