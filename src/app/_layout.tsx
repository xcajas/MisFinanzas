import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { isFirebaseConfigured } from '../lib/firebase';
import { AuthProvider, useAuth } from '../state/AuthContext';
import { DataProvider } from '../state/DataContext';
import { colors } from '../theme/colors';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      {isFirebaseConfigured ? (
        <AuthProvider>
          <Gate />
        </AuthProvider>
      ) : (
        <ConfigMissing />
      )}
    </SafeAreaProvider>
  );
}

function Gate() {
  const { initializing, user, unlocked } = useAuth();

  useEffect(() => {
    if (!initializing) SplashScreen.hideAsync().catch(() => {});
  }, [initializing]);

  if (initializing) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const stack = (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={!unlocked}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={unlocked}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="editar/[id]" options={{ presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );

  // Los datos se montan con la sesión (aunque la app esté bloqueada) para que la caché
  // cargue y la sincronización siga en segundo plano.
  return user ? (
    <DataProvider key={user.uid} uid={user.uid}>
      {stack}
    </DataProvider>
  ) : (
    stack
  );
}

function ConfigMissing() {
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.cfg}>
      <Text style={styles.cfgIcon}>⚙️</Text>
      <Text style={styles.cfgTitle}>Falta configurar Firebase</Text>
      <Text style={styles.cfgText}>
        Copia el archivo <Text style={styles.code}>.env.example</Text> como <Text style={styles.code}>.env</Text>,
        completa los valores de tu proyecto de Firebase y reinicia con{' '}
        <Text style={styles.code}>npx expo start -c</Text>.
      </Text>
      <Text style={styles.cfgText}>Guía paso a paso: docs/FIREBASE_SETUP.md</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cfg: { flexGrow: 1, justifyContent: 'center', padding: 30 },
  cfgIcon: { fontSize: 44, textAlign: 'center', marginBottom: 12 },
  cfgTitle: { color: colors.text, fontSize: 21, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  cfgText: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 10 },
  code: { color: colors.accent, fontFamily: 'monospace' },
});
