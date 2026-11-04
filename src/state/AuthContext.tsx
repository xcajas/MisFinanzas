// Sesión de Firebase Auth + bloqueo con huella/Face ID.
//
// La sesión de Firebase queda persistida en el dispositivo (funciona sin internet).
// Si el desbloqueo biométrico está activo, la app arranca "bloqueada" y se abre con
// la huella/Face ID (o con la contraseña). También se bloquea tras 60 s en segundo plano.
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getFirebaseAuth } from '../lib/firebase';
import { authenticateBiometric, getBiometricInfo, type BiometricInfo } from '../services/biometrics';
import { clearLocalCache } from './DataContext';

const PREFS_KEY = 'mf:prefs:v1';
const LOCK_AFTER_MS = 60_000;

interface Prefs {
  biometricEnabled: boolean;
  biometricAsked: boolean;
  lastEmail: string;
}
const defaultPrefs: Prefs = { biometricEnabled: false, biometricAsked: false, lastEmail: '' };

interface AuthContextValue {
  initializing: boolean;
  user: User | null;
  locked: boolean;
  unlocked: boolean;
  biometric: BiometricInfo;
  biometricEnabled: boolean;
  biometricAsked: boolean;
  lastEmail: string;
  signIn: (email: string, password: string) => Promise<void>;
  unlockWithBiometric: () => Promise<boolean>;
  setBiometricEnabled: (v: boolean) => Promise<void>;
  markBiometricAsked: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthContextValue | null>(null);

/** Mensajes de error de Firebase Auth en español. */
export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'El correo no es válido.';
    case 'auth/missing-password':
      return 'Ingresa tu contraseña.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
    case 'auth/network-request-failed':
      return 'Sin conexión. Necesitas internet para el primer ingreso con contraseña.';
    case 'auth/user-disabled':
      return 'Esta cuenta está deshabilitada.';
    default:
      return 'No se pudo completar la operación. Inténtalo de nuevo.';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [locked, setLocked] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [biometric, setBiometric] = useState<BiometricInfo>({ available: false, label: 'huella' });
  const prefsRef = useRef(prefs); // se actualiza junto con setPrefs
  const firstAuthEvent = useRef(true);

  const savePrefs = useCallback(async (patch: Partial<Prefs>) => {
    const next = { ...prefsRef.current, ...patch };
    prefsRef.current = next;
    setPrefs(next);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  }, []);

  // Arranque: preferencias + biometría + sesión persistida.
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PREFS_KEY);
        if (raw) {
          const p = { ...defaultPrefs, ...JSON.parse(raw) };
          prefsRef.current = p;
          setPrefs(p);
        }
      } catch {}
      setBiometric(await getBiometricInfo());
      unsub = onAuthStateChanged(getFirebaseAuth(), (u) => {
        if (firstAuthEvent.current) {
          // Sesión restaurada al abrir la app: bloquear si el usuario activó la huella.
          firstAuthEvent.current = false;
          setLocked(Boolean(u && prefsRef.current.biometricEnabled));
        }
        setUser(u);
        setInitializing(false);
      });
    })();
    return () => unsub();
  }, []);

  // Bloquear al volver después de un rato en segundo plano.
  useEffect(() => {
    let backgroundAt = 0;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') backgroundAt = Date.now();
      if (s === 'active' && backgroundAt && Date.now() - backgroundAt > LOCK_AFTER_MS) {
        if (prefsRef.current.biometricEnabled) setLocked(true);
        backgroundAt = 0;
      }
    });
    return () => sub.remove();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const auth = getFirebaseAuth();
      const clean = email.trim();
      // Si había otra cuenta en el dispositivo, cerrarla primero.
      if (auth.currentUser && auth.currentUser.email?.toLowerCase() !== clean.toLowerCase()) {
        await clearLocalCache(auth.currentUser.uid);
        await fbSignOut(auth);
      }
      await signInWithEmailAndPassword(auth, clean, password);
      await savePrefs({ lastEmail: clean });
      setLocked(false);
    },
    [savePrefs],
  );

  const unlockWithBiometric = useCallback(async () => {
    const ok = await authenticateBiometric();
    if (ok) setLocked(false);
    return ok;
  }, []);

  const setBiometricEnabled = useCallback(
    async (v: boolean) => {
      if (v) {
        const ok = await authenticateBiometric('Confirma para activar el desbloqueo');
        if (!ok) return;
      }
      await savePrefs({ biometricEnabled: v, biometricAsked: true });
    },
    [savePrefs],
  );

  const markBiometricAsked = useCallback(() => savePrefs({ biometricAsked: true }), [savePrefs]);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    const uid = auth.currentUser?.uid;
    await fbSignOut(auth);
    if (uid) await clearLocalCache(uid);
    await savePrefs({ biometricEnabled: false, biometricAsked: false });
    setLocked(false);
  }, [savePrefs]);

  const value: AuthContextValue = {
    initializing,
    user,
    locked,
    unlocked: Boolean(user) && !locked,
    biometric,
    biometricEnabled: prefs.biometricEnabled,
    biometricAsked: prefs.biometricAsked,
    lastEmail: prefs.lastEmail || user?.email || '',
    signIn,
    unlockWithBiometric,
    setBiometricEnabled,
    markBiometricAsked,
    resetPassword,
    signOut,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return v;
}
