// Inicio: balance del mes, ingresos, gastos, tasa de ahorro, % de presupuesto y gastos por categoría.
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Empty, Panel, ProgressBar, SectionHeader, Tag } from '../../components/ui';
import { categoryIcon } from '../../constants/categories';
import { budgetUsageTag, savingsTag, summarizeMonth } from '../../lib/finance';
import { fmtSignedUSD, fmtUSD } from '../../lib/format';
import { useData } from '../../state/DataContext';
import { CATEGORY_BAR_COLORS, colors } from '../../theme/colors';

export default function HomeScreen() {
  const { transactions, budgets, month } = useData();
  const s = useMemo(() => summarizeMonth(transactions, month, budgets), [transactions, month, budgets]);
  const cats = Object.entries(s.byCategory).sort((a, b) => b[1] - a[1]);
  const st = savingsTag(s.savingsRate);
  const bt = budgetUsageTag(s.budgetPct);

  return (
    <Screen>
      <LinearGradient colors={[colors.heroFrom, colors.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.heroLbl}>Balance del mes</Text>
        <Text style={styles.heroBig} adjustsFontSizeToFit numberOfLines={1}>
          {fmtSignedUSD(s.balance)}
        </Text>
        <View style={styles.split}>
          <View style={styles.mini}>
            <Text style={styles.miniT}>↓ Ingresos</Text>
            <Text style={styles.miniV}>{fmtUSD(s.income)}</Text>
          </View>
          <View style={styles.mini}>
            <Text style={styles.miniT}>↑ Gastos</Text>
            <Text style={styles.miniV}>{fmtUSD(s.expense)}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.sec}>
        <SectionHeader title="Evaluación del mes" />
        <View style={styles.evalGrid}>
          <View style={styles.epill}>
            <Text style={styles.epillT}>Tasa de ahorro</Text>
            <Text style={styles.epillV}>{s.savingsRate}%</Text>
            <Tag level={st.level} label={st.label} />
          </View>
          <View style={styles.epill}>
            <Text style={styles.epillT}>Presupuesto usado</Text>
            <Text style={styles.epillV}>{s.budgetPct}%</Text>
            <Tag level={bt.level} label={bt.label} />
          </View>
        </View>
      </View>

      <View style={styles.sec}>
        <SectionHeader title="Gastos por categoría" />
        <Panel>
          {cats.length ? (
            cats.map(([c, v], i) => {
              const pct = s.expense ? Math.round((v / s.expense) * 100) : 0;
              return (
                <View key={c} style={[styles.barRow, i === cats.length - 1 && { marginBottom: 0 }]}>
                  <View style={styles.barTop}>
                    <Text style={styles.barName}>
                      {categoryIcon(c)} {c}
                    </Text>
                    <Text style={styles.barPct}>
                      {fmtUSD(v)} · {pct}%
                    </Text>
                  </View>
                  <ProgressBar pct={pct} color={CATEGORY_BAR_COLORS[i % CATEGORY_BAR_COLORS.length]} />
                </View>
              );
            })
          ) : (
            <Empty text="Sin gastos este mes" />
          )}
        </Panel>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 22, padding: 22, marginBottom: 14 },
  heroLbl: { fontSize: 12, color: 'rgba(255,255,255,.85)' },
  heroBig: { fontSize: 33, fontWeight: '800', color: '#fff', marginTop: 4, marginBottom: 14 },
  split: { flexDirection: 'row', gap: 10 },
  mini: { flex: 1, backgroundColor: 'rgba(255,255,255,.14)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  miniT: { fontSize: 11, color: 'rgba(255,255,255,.85)' },
  miniV: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 2 },
  sec: { marginBottom: 14 },
  evalGrid: { flexDirection: 'row', gap: 10 },
  epill: { flex: 1, backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: 16, padding: 14 },
  epillT: { fontSize: 11, color: colors.muted },
  epillV: { fontSize: 19, fontWeight: '700', marginTop: 4, color: colors.text },
  barRow: { marginBottom: 13 },
  barTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  barName: { fontSize: 13, color: colors.text },
  barPct: { fontSize: 12, color: colors.muted },
});
