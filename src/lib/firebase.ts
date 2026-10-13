import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut, type Auth, type User } from 'firebase/auth';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

/** Names of build-time variables that were empty. Shown on screen instead of a blank page. */
export const missingConfig = Object.entries({
  VITE_FIREBASE_API_KEY: cfg.apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: cfg.authDomain,
  VITE_FIREBASE_PROJECT_ID: cfg.projectId,
  VITE_API_URL: import.meta.env.VITE_API_URL,
}).filter(([, v]) => !v).map(([k]) => k);

export const auth: Auth | null = missingConfig.length ? null : getAuth(initializeApp(cfg));
export const signIn = () => signInWithPopup(auth!, new GoogleAuthProvider());
export const signOutUser = () => signOut(auth!);
export const watchAuth = (cb: (u: User | null) => void) => (auth ? onAuthStateChanged(auth, cb) : () => {});
export async function getToken(): Promise<string> {
  if (!auth?.currentUser) throw new Error('Not signed in');
  return auth.currentUser.getIdToken();
}
