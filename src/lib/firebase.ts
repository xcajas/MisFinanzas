// Inicialización de Firebase (Auth + Firestore) para React Native.
// La configuración se lee de variables EXPO_PUBLIC_FIREBASE_* (archivo .env).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

function ensureApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase no está configurado. Revisa el archivo .env (ver docs/FIREBASE_SETUP.md).');
  }
  if (!app) app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

/** Auth con sesión persistida en AsyncStorage (sigue logueado sin internet). */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    const a = ensureApp();
    try {
      auth = initializeAuth(a, { persistence: getReactNativePersistence(AsyncStorage) });
    } catch {
      // Ya inicializado (p. ej. tras un Fast Refresh).
      auth = getAuth(a);
    }
  }
  return auth;
}

export function getDb(): Firestore {
  if (!db) db = getFirestore(ensureApp());
  return db;
}
