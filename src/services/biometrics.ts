// Huella / Face ID con expo-local-authentication.
import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricInfo {
  available: boolean; // hay hardware y el usuario tiene huella/rostro registrado
  label: string; // "huella", "Face ID" o "biometría"
}

export async function getBiometricInfo(): Promise<BiometricInfo> {
  try {
    const [hasHardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    const T = LocalAuthentication.AuthenticationType;
    let label = 'biometría';
    if (types.includes(T.FINGERPRINT)) label = 'huella';
    else if (types.includes(T.FACIAL_RECOGNITION)) label = 'Face ID';
    return { available: hasHardware && enrolled, label };
  } catch {
    return { available: false, label: 'biometría' };
  }
}

export async function authenticateBiometric(prompt = 'Desbloquear Mis Finanzas'): Promise<boolean> {
  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar código del dispositivo',
    disableDeviceFallback: false,
  });
  return res.success;
}
