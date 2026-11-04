// Login: correo + contraseña (Firebase Auth) y desbloqueo con huella / Face ID.
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/ui';
import { authErrorMessage, useAuth } from '../state/AuthContext';
import { colors } from '../theme/colors';

export default function LoginScreen() {
  const {
    user,
    locked,
    lastEmail,
    biometric,
    biometricEnabled,
    biometricAsked,
    signIn,
    unlockWithBiometric,
    setBiometricEnabled,
    markBiometricAsked,
    resetPassword,
  } = useAuth();
  const [email, setEmail] = useState(lastEmail);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const canUseBiometric = Boolean(user && locked && biometricEnabled && biometric.available);
  const bioName = biometric.label === 'Face ID' ? 'Face ID' : 'huella';

  // Si la app está bloqueada, pedir la huella automáticamente al abrir.
  useEffect(() => {
    if (canUseBiometric) unlockWithBiometric().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const offerBiometric = () => {
    if (!biometric.available || biometricEnabled || biometricAsked) return;
    Alert.alert(
      `¿Activar ${bioName}?`,
      `La próxima vez podrás abrir Mis Finanzas con tu ${bioName}, sin escribir la contraseña.`,
      [
        { text: 'Ahora no', style: 'cancel', onPress: () => markBiometricAsked() },
        { text: 'Activar', onPress: () => setBiometricEnabled(true) },
      ],
    );
  };

  const onLogin = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
      offerBiometric();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onBiometric = async () => {
    setError(null);
    if (!biometric.available) {
      Alert.alert('No disponible', 'Este dispositivo no tiene huella o Face ID configurado.');
      return;
    }
    if (!canUseBiometric) {
      Alert.alert(
        `Ingresar con ${bioName}`,
        `Primero ingresa con tu correo y contraseña; luego podrás activar el desbloqueo con ${bioName}.`,
      );
      return;
    }
    const ok = await unlockWithBiometric();
    if (!ok) setError(`No se pudo verificar tu ${bioName}.`);
  };

  const onForgot = () => {
    if (!email.trim()) {
      Alert.alert('Recuperar contraseña', 'Escribe tu correo arriba y vuelve a tocar "¿Olvidaste tu contraseña?".');
      return;
    }
    resetPassword(email)
      .then(() => Alert.alert('Revisa tu correo', `Enviamos un enlace para restablecer la contraseña a ${email.trim()}.`))
      .catch((e) => Alert.alert('Error', authErrorMessage(e)));
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <LinearGradient colors={[colors.heroFrom, colors.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mark}>
              <Text style={{ fontSize: 38 }}>💰</Text>
            </LinearGradient>
            <Text style={styles.h2}>Mis Finanzas</Text>
            <Text style={styles.p}>{locked ? 'Tu sesión está bloqueada' : 'Controla tus ingresos y gastos'}</Text>
          </View>

          <Text style={styles.label}>Correo</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder="tu@correo.com"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passRef.current?.focus()}
          />
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            ref={passRef}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.faint}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={onLogin}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {busy ? (
            <View style={styles.busy}>
              <ActivityIndicator color={colors.accentInk} />
            </View>
          ) : (
            <PrimaryButton title="Ingresar" onPress={onLogin} style={{ marginTop: 10 }} />
          )}

          <Pressable onPress={onBiometric} accessibilityRole="button" style={{ marginTop: 22 }}>
            <Text style={styles.bio}>🔒 Ingresar con {bioName}</Text>
          </Pressable>
          <Pressable onPress={onForgot} accessibilityRole="button" style={{ marginTop: 18 }}>
            <Text style={styles.alt}>¿Olvidaste tu contraseña?</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 40 },
  logo: { alignItems: 'center', marginBottom: 34 },
  mark: { width: 76, height: 76, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  h2: { color: colors.text, fontSize: 23, fontWeight: '700' },
  p: { color: colors.muted, fontSize: 13, marginTop: 4 },
  label: { fontSize: 12, color: colors.muted, marginBottom: 7, fontWeight: '600' },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 13,
    padding: 14,
    fontSize: 15,
    marginBottom: 14,
  },
  error: { color: colors.expense, fontSize: 13, marginBottom: 4, textAlign: 'center' },
  busy: { backgroundColor: colors.accent, borderRadius: 15, paddingVertical: 16, marginTop: 14, alignItems: 'center' },
  bio: { textAlign: 'center', color: colors.accent, fontSize: 13 },
  alt: { textAlign: 'center', color: colors.muted, fontSize: 12 },
});
