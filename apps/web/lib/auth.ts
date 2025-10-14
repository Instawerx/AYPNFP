import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
} from "firebase/auth";
import { auth } from "./firebase";

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  return userCredential.user;
}

/**
 * Sign in with Apple
 */
export async function signInWithApple(): Promise<User> {
  const provider = new OAuthProvider("apple.com");
  const userCredential = await signInWithPopup(auth, provider);
  return userCredential.user;
}

/**
 * Sign in with Microsoft
 */
export async function signInWithMicrosoft(): Promise<User> {
  const provider = new OAuthProvider("microsoft.com");
  const userCredential = await signInWithPopup(auth, provider);
  return userCredential.user;
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Get user's custom claims (RBAC)
 */
export async function getUserClaims(): Promise<any> {
  const user = auth.currentUser;
  if (!user) return null;

  const idTokenResult = await user.getIdTokenResult();
  return idTokenResult.claims;
}

/**
 * Check if user has a specific scope
 */
export async function hasScope(scope: string): Promise<boolean> {
  const claims = await getUserClaims();
  return claims?.scopes?.includes(scope) || false;
}
