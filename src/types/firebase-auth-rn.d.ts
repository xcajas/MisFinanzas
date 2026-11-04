// En React Native, Metro resuelve la build "react-native" de firebase/auth, que exporta
// getReactNativePersistence. TypeScript usa los tipos web, así que lo declaramos aquí.
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
