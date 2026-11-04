// Formulario de movimiento (nuevo o edición): toggle ingreso/gasto, monto, descripción,
// categoría con íconos y fecha. Al guardar un gasto avisa si la categoría se acerca o pasa su tope.
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CATEGORIES } from '../constants/categories';
import { budgetLevel } from '../lib/finance';
import { fmtUSD, parseAmount, todayISO } from '../lib/format';
import type { Transaction, TxType } from '../lib/types';
import { useData } from '../state/DataContext';
import { colors } from '../theme/colors';
import { DateField } from './DateField';
import { PrimaryButton } from './ui';

interface Props {
  initial?: Transaction;
  onSaved: (tx: Transaction) => void;
  onDeleted?: () => void;
}

export function TransactionForm({ initial, onSaved, onDeleted }: Props) {
  const { saveTransaction, deleteTransaction, budgets, transactions } = useData();
  const [type, setType] = useState<TxType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [desc, setDesc] = useState(initial?.description ?? '');
  const [cat, setCat] = useState(initial?.category ?? CATEGORIES.expense[0].name);
  const [date, setDate] = useState(initial?.date ?? todayISO());

  const changeType = (t: TxType) => {
    setType(t);
    if (!CATEGORIES[t].some((c) => c.name === cat)) setCat(CATEGORIES[t][0].name);
  };

  const save = () => {
    const amt = parseAmount(amount);
    if (!amt || amt <= 0 || !date) {
      Alert.alert('Datos incompletos', 'Ingresa un monto y una fecha válidos.');
      return;
    }
    const tx = saveTransaction({ id: initial?.id, type, amount: amt, description: desc, category: cat, date });

    // Alerta de presupuesto (verde < 80 %, amarillo 80–100 %, rojo > 100 %).
    const cap = budgets[cat];
    if (type === 'expense' && cap) {
      const month = date.slice(0, 7);
      const spent =
        transactions
          .filter((t) => t.id !== tx.id && t.type === 'expense' && t.category === cat && t.date.startsWith(month))
          .reduce((s, t) => s + t.amount, 0) + tx.amount;
      const pct = Math.round((spent / cap) * 100);
      const lvl = budgetLevel(pct);
      if (lvl === 'warn') {
        Alert.alert('🔴 Presupuesto excedido', `${cat}: ${pct}% (${fmtUSD(spent)} de ${fmtUSD(cap)}).`);
      } else if (lvl === 'mid') {
        Alert.alert('🟡 Cerca del límite', `${cat}: ${pct}% (${fmtUSD(spent)} de ${fmtUSD(cap)}).`);
      }
    }

    if (!initial) {
      setAmount('');
      setDesc('');
    }
    onSaved(tx);
  };

  const remove = () => {
    if (!initial) return;
    Alert.alert('Eliminar movimiento', `¿Eliminar "${initial.description}" por ${fmtUSD(initial.amount)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          deleteTransaction(initial.id);
          onDeleted?.();
        },
      },
    ]);
  };

  return (
    <View>
      <View style={styles.toggle} accessibilityRole="radiogroup">
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: type === 'income' }}
          onPress={() => changeType('income')}
          style={[styles.toggleBtn, type === 'income' && { backgroundColor: colors.income }]}
        >
          <Text style={[styles.toggleText, type === 'income' && { color: colors.incomeInk }]}>Ingreso</Text>
        </Pressable>
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: type === 'expense' }}
          onPress={() => changeType('expense')}
          style={[styles.toggleBtn, type === 'expense' && { backgroundColor: colors.expense }]}
        >
          <Text style={[styles.toggleText, type === 'expense' && { color: colors.expenseInk }]}>Gasto</Text>
        </Pressable>
      </View>

      <Field label="Monto (USD)">
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={colors.faint}
          keyboardType="decimal-pad"
          style={[styles.input, styles.amount]}
          accessibilityLabel="Monto en dólares"
        />
      </Field>

      <Field label="Descripción">
        <TextInput
          value={desc}
          onChangeText={setDesc}
          placeholder="Ej. Supermercado, Sueldo..."
          placeholderTextColor={colors.faint}
          style={styles.input}
          maxLength={80}
          returnKeyType="done"
        />
      </Field>

      <Field label="Categoría">
        <View style={styles.catGrid}>
          {CATEGORIES[type].map((c) => {
            const sel = c.name === cat;
            return (
              <Pressable
                key={c.name}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={c.name}
                onPress={() => setCat(c.name)}
                style={[styles.catBtn, sel && styles.catBtnSel]}
              >
                <Text style={styles.catIcon}>{c.icon}</Text>
                <Text style={[styles.catText, sel && { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label="Fecha">
        <DateField value={date} onChange={setDate} />
      </Field>

      <PrimaryButton title={initial ? 'Guardar cambios' : 'Guardar movimiento'} onPress={save} />
      {initial ? (
        <PrimaryButton
          title="Eliminar movimiento"
          onPress={remove}
          color="transparent"
          textColor={colors.expense}
          style={{ borderWidth: 1, borderColor: colors.line, marginTop: 10 }}
        />
      ) : null}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    padding: 5,
    marginBottom: 18,
  },
  toggleBtn: { flex: 1, padding: 11, borderRadius: 10, alignItems: 'center' },
  toggleText: { color: colors.muted, fontWeight: '700', fontSize: 14 },
  label: { fontSize: 12, color: colors.muted, marginBottom: 7, fontWeight: '600' },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 13,
    padding: 14,
    fontSize: 15,
  },
  amount: { fontSize: 28, fontWeight: '800', textAlign: 'center', paddingVertical: 18 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    width: '22.5%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 13,
    paddingVertical: 11,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  catBtnSel: { borderColor: colors.accent, backgroundColor: 'rgba(56,189,248,.12)' },
  catIcon: { fontSize: 20, marginBottom: 3 },
  catText: { fontSize: 10, color: colors.muted },
});
