import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { AppHeader } from './AppHeader';

/** Contenedor de cada pestaña: área segura + encabezado + contenido desplazable. */
export function Screen({ children, showMonth = true }: { children: React.ReactNode; showMonth?: boolean }) {
  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <AppHeader showMonth={showMonth} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
});
