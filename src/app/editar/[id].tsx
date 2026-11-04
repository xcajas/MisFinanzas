// Editar / eliminar un movimiento existente (se abre como modal desde Movimientos).
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionForm } from '../../components/TransactionForm';
import { Empty } from '../../components/ui';
import { useData } from '../../state/DataContext';
import { colors } from '../../theme/colors';

export default function EditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTransaction, setMonth } = useData();
  const tx = id ? getTransaction(id) : undefined;
  const close = () => (router.canGoBack() ? router.back() : router.replace('/movimientos'));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.bar}>
        <Text style={styles.title}>Editar movimiento</Text>
        <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {tx ? (
            <TransactionForm
              key={tx.id}
              initial={tx}
              onSaved={(saved) => {
                setMonth(saved.date.slice(0, 7));
                close();
              }}
              onDeleted={close}
            />
          ) : (
            <Empty text="Este movimiento ya no existe." />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: { color: colors.text, fontSize: 19, fontWeight: '700' },
  close: { color: colors.muted, fontSize: 20 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
});
