
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBSm03ytoqWx9yNxL-KF3he0dDzFC8DdzU",
  authDomain: "swiftbites-23d4b.firebaseapp.com",
  databaseURL: "https://swiftbites-23d4b-default-rtdb.firebaseio.com",
  projectId: "swiftbites-23d4b",
  storageBucket: "swiftbites-23d4b.firebasestorage.app",
  messagingSenderId: "549713410717",
  appId: "1:549713410717:web:5f12751c5d1c09f64e3274",
  measurementId: "G-BX0VPYS7Z0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
