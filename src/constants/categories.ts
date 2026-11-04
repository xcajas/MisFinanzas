import type { TxType } from '../lib/types';

export interface Category {
  name: string;
  icon: string;
}

export const CATEGORIES: Record<TxType, Category[]> = {
  income: [
    { name: 'Sueldo', icon: '💼' },
    { name: 'Freelance', icon: '💻' },
    { name: 'Inversiones', icon: '📈' },
    { name: 'Otros', icon: '➕' },
  ],
  expense: [
    { name: 'Vivienda', icon: '🏠' },
    { name: 'Alimentación', icon: '🛒' },
    { name: 'Transporte', icon: '🚗' },
    { name: 'Servicios', icon: '💡' },
    { name: 'Salud', icon: '💊' },
    { name: 'Educación', icon: '📚' },
    { name: 'Ocio', icon: '🎬' },
    { name: 'Otros', icon: '📦' },
  ],
};

export const EXPENSE_CATEGORY_NAMES = CATEGORIES.expense.map((c) => c.name);

const ICONS: Record<string, string> = {
  Sueldo: '💼',
  Freelance: '💻',
  Inversiones: '📈',
  Vivienda: '🏠',
  Alimentación: '🛒',
  Transporte: '🚗',
  Servicios: '💡',
  Salud: '💊',
  Educación: '📚',
  Ocio: '🎬',
  Otros: '📦',
};

export const categoryIcon = (name: string) => ICONS[name] ?? '📦';
