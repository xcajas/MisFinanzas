// Movimientos del mes: tocar para editar, "×" para eliminar.
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Empty, Panel, SectionHeader } from '../../components/ui';
import { categoryIcon } from '../../constants/categories';
import { summarizeMonth } from '../../lib/finance';
import { fmtUSD, shortDateLabel } from '../../lib/format';
import type { Transaction } from '../../lib/types';
import { useData } from '../../state/DataContext';
import { colors } from '../../theme/colors';

export default function TransactionsScreen() {
  const { transactions, budgets, month, deleteTransaction } = useData();
  const { list } = useMemo(() => summarizeMonth(transactions, month, budgets), [transactions, month, budgets]);

  const confirmDelete = (t: Transaction) =>
    Alert.alert('Eliminar movimiento', `¿Eliminar "${t.description}" por ${fmtUSD(t.amount)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteTransaction(t.id) },
    ]);

  return (
    <Screen>
      <SectionHeader title="Movimientos del mes" right={<Text style={styles.count}>{list.length}</Text>} />
      <Panel style={{ paddingVertical: 4 }}>
        {list.length ? (
          list.map((t, i) => {
            const inc = t.type === 'income';
            return (
              <Pressable
                key={t.id}
                onPress={() => router.push({ pathname: '/editar/[id]', params: { id: t.id } })}
                onLongPress={() => confirmDelete(t)}
                accessibilityRole="button"
                accessibilityHint="Toca para editar"
                style={({ pressed }) => [styles.tx, i === list.length - 1 && { borderBottomWidth: 0 }, pressed && { opacity: 0.7 }]}
              >
                <View style={[styles.ic, { backgroundColor: inc ? 'rgba(52,211,153,.15)' : 'rgba(251,113,133,.15)' }]}>
                  <Text style={{ fontSize: 18 }}>{categoryIcon(t.category)}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.d} numberOfLines={1}>
                    {t.description}
                  </Text>
                  <Text style={styles.c}>
                    {t.category} · {shortDateLabel(t.date)}
                  </Text>
                </View>
                <Text style={[styles.a, { color: inc ? colors.income : colors.expense }]}>
                  {inc ? '+' : '−'}
                  {fmtUSD(t.amount)}
                </Text>
                <Pressable
                  onPress={() => confirmDelete(t)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar ${t.description}`}
                >
                  <Text style={styles.del}>×</Text>
                </Pressable>
              </Pressable>
            );
          })
        ) : (
          <Empty text="Sin movimientos este mes" />
        )}
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  count: { color: colors.muted, fontSize: 12 },
  tx: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.card2,
  },
  ic: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  d: { fontSize: 14, fontWeight: '600', color: colors.text },
  c: { fontSize: 12, color: colors.muted },
  a: { fontSize: 15, fontWeight: '700' },
  del: { color: colors.faint, fontSize: 20, paddingHorizontal: 2 },
});
