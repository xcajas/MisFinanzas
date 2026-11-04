// Presupuesto: tope mensual por categoría con alertas verde / amarillo / rojo.
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Panel, ProgressBar, SectionHeader, Tag } from '../../components/ui';
import { CATEGORIES } from '../../constants/categories';
import { budgetLevel, categoryTagLabel, levelColor, summarizeMonth } from '../../lib/finance';
import { fmtUSD, parseAmount } from '../../lib/format';
import { useData } from '../../state/DataContext';
import { colors } from '../../theme/colors';

export default function BudgetScreen() {
  const { transactions, budgets, month, setBudget } = useData();
  const s = useMemo(() => summarizeMonth(transactions, month, budgets), [transactions, month, budgets]);

  return (
    <Screen>
      <SectionHeader title="Presupuesto mensual" />
      <Text style={styles.intro}>Define un tope por categoría. La app te avisa al acercarte o pasarte.</Text>
      <Panel style={{ paddingVertical: 4 }}>
        {CATEGORIES.expense.map((c, i) => (
          <BudgetRow
            key={`${c.name}:${budgets[c.name] ?? 0}`}
            name={c.name}
            icon={c.icon}
            cap={budgets[c.name] ?? 0}
            spent={s.byCategory[c.name] ?? 0}
            last={i === CATEGORIES.expense.length - 1}
            onSave={(v) => setBudget(c.name, v)}
          />
        ))}
      </Panel>
      {s.budgetTotal ? (
        <Text style={styles.total}>
          Total presupuestado {fmtUSD(s.budgetTotal)} · gastado {fmtUSD(s.budgetSpent)} ({s.budgetPct}%)
        </Text>
      ) : null}
    </Screen>
  );
}

function BudgetRow(props: {
  name: string;
  icon: string;
  cap: number;
  spent: number;
  last: boolean;
  onSave: (v: number) => void;
}) {
  const { name, icon, cap, spent, last, onSave } = props;
  // La fila se vuelve a montar (key) cuando cambia el tope guardado.
  const [text, setText] = useState(cap ? String(cap) : '');

  const rawPct = cap ? Math.round((spent / cap) * 100) : 0;
  const pct = Math.min(rawPct, 140);
  const lvl = budgetLevel(rawPct, cap > 0);

  const commit = () => {
    const v = text.trim() === '' ? 0 : parseAmount(text);
    if (Number.isNaN(v)) {
      setText(cap ? String(cap) : '');
      return;
    }
    if (v !== cap) onSave(v);
  };

  return (
    <View style={[styles.bud, last && { borderBottomWidth: 0 }]}>
      <View style={styles.top}>
        <Text style={styles.name}>
          {icon} {name}
        </Text>
        <View style={styles.cap}>
          <Text style={{ color: colors.muted }}>$</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            onEndEditing={commit}
            onSubmitEditing={commit}
            placeholder="0"
            placeholderTextColor={colors.faint}
            keyboardType="decimal-pad"
            returnKeyType="done"
            style={styles.capInput}
            accessibilityLabel={`Tope mensual de ${name}`}
          />
        </View>
      </View>
      <ProgressBar pct={pct} color={levelColor[lvl]} />
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          Gastado {fmtUSD(spent)} {cap ? `de ${fmtUSD(cap)}` : '(sin tope)'}
        </Text>
        {cap ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.metaText}>{rawPct}%</Text>
            <View style={{ marginTop: -6 }}>
              <Tag level={lvl} label={categoryTagLabel[lvl]} />
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { color: colors.muted, fontSize: 12, marginTop: -4, marginHorizontal: 2, marginBottom: 12 },
  bud: { paddingVertical: 14, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: colors.card2 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  name: { fontSize: 14, color: colors.text },
  cap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  capInput: {
    width: 84,
    paddingVertical: 7,
    paddingHorizontal: 9,
    fontSize: 13,
    textAlign: 'right',
    color: colors.text,
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 10,
  },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  metaText: { fontSize: 11, color: colors.muted },
  total: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 12 },
});
