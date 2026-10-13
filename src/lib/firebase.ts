import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
});
export const auth = getAuth(app);
export const signIn = () => signInWithPopup(auth, new GoogleAuthProvider());
export const signOutUser = () => signOut(auth);
export const watchAuth = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb);
export async function getToken(): Promise<string> {
  if (!auth.currentUser) throw new Error('Not signed in');
  return auth.currentUser.getIdToken();
}
