// Chip de mes (como el <select> del prototipo) que abre una lista de meses.
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { addMonths, currentMonth, monthLabel, monthLabelLong } from '../lib/format';
import { useData } from '../state/DataContext';
import { colors } from '../theme/colors';

export function MonthPicker() {
  const { month, setMonth, transactions } = useData();
  const [open, setOpen] = useState(false);

  const months = useMemo(() => {
    const set = new Set(transactions.map((t) => t.date.slice(0, 7)));
    const cur = currentMonth();
    for (let i = 0; i < 12; i++) set.add(addMonths(cur, -i));
    set.add(month);
    return [...set].sort().reverse();
  }, [transactions, month]);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mes: ${monthLabelLong(month)}. Cambiar mes`}
        onPress={() => setOpen(true)}
        style={styles.chip}
      >
        <Text style={styles.chipText}>{monthLabel(month)} ▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Selecciona el mes</Text>
            <FlatList
              data={months}
              keyExtractor={(m) => m}
              style={{ maxHeight: 380 }}
              renderItem={({ item }) => {
                const sel = item === month;
                return (
                  <Pressable
                    onPress={() => {
                      setMonth(item);
                      setOpen(false);
                    }}
                    style={[styles.row, sel && styles.rowSel]}
                  >
                    <Text style={[styles.rowText, sel && { color: colors.accent }]}>{monthLabelLong(item)}</Text>
                    {sel ? <Text style={{ color: colors.accent }}>✓</Text> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.55)', justifyContent: 'center', padding: 28 },
  sheet: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 12 },
  sheetTitle: { color: colors.text, fontWeight: '700', fontSize: 15, padding: 8, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderRadius: 10 },
  rowSel: { backgroundColor: 'rgba(56,189,248,.12)' },
  rowText: { color: colors.text, fontSize: 14 },
});
