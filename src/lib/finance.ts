// Cálculos del mes: balance, tasa de ahorro, presupuesto y alertas.
import { colors } from '../theme/colors';
import type { Budgets, Transaction } from './types';

export interface MonthSummary {
  list: Transaction[]; // ordenada por fecha desc
  income: number;
  expense: number;
  balance: number;
  byCategory: Record<string, number>; // solo gastos
  savingsRate: number; // %
  budgetTotal: number;
  budgetSpent: number;
  budgetPct: number; // %
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function summarizeMonth(txs: Transaction[], month: string, budgets: Budgets): MonthSummary {
  const list = txs
    .filter((t) => t.date.slice(0, 7) === month)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  let income = 0;
  let expense = 0;
  const byCategory: Record<string, number> = {};
  for (const t of list) {
    if (t.type === 'income') income += t.amount;
    else {
      expense += t.amount;
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    }
  }
  income = round2(income);
  expense = round2(expense);

  const savingsRate = income ? Math.round(((income - expense) / income) * 100) : 0;
  const budgetTotal = Object.values(budgets).reduce((s, v) => s + v, 0);
  const budgetSpent = Object.keys(budgets).reduce((s, c) => s + (byCategory[c] ?? 0), 0);
  const budgetPct = budgetTotal ? Math.round((budgetSpent / budgetTotal) * 100) : 0;

  return {
    list,
    income,
    expense,
    balance: round2(income - expense),
    byCategory,
    savingsRate,
    budgetTotal,
    budgetSpent,
    budgetPct,
  };
}

export type Level = 'ok' | 'mid' | 'warn' | 'none';

/** Verde < 80 %, amarillo 80–100 %, rojo > 100 % (igual que el prototipo). */
export function budgetLevel(pct: number, hasCap = true): Level {
  if (!hasCap) return 'none';
  if (pct < 80) return 'ok';
  if (pct <= 100) return 'mid';
  return 'warn';
}

export const levelColor: Record<Level, string> = {
  ok: colors.income,
  mid: colors.warn,
  warn: colors.expense,
  none: colors.neutral,
};

export function savingsTag(rate: number): { level: Level; label: string } {
  if (rate >= 20) return { level: 'ok', label: 'Saludable' };
  if (rate >= 0) return { level: 'mid', label: 'Ajustado' };
  return { level: 'warn', label: 'Déficit' };
}

export function budgetUsageTag(pct: number): { level: Level; label: string } {
  if (pct < 80) return { level: 'ok', label: 'En control' };
  if (pct <= 100) return { level: 'mid', label: 'Al límite' };
  return { level: 'warn', label: 'Excedido' };
}

export const categoryTagLabel: Record<Level, string> = {
  ok: 'OK',
  mid: 'Cerca',
  warn: 'Excedido',
  none: '',
};
