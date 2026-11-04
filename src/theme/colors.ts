// Paleta tomada del prototipo aprobado (variables :root).
export const colors = {
  bg: '#0b1120',
  card: '#1a2336',
  card2: '#232e45',
  line: '#2d3a54',
  text: '#e8edf6',
  muted: '#8b98b2',
  faint: '#5b6a86',
  accent: '#38bdf8',
  accentInk: '#06281c',
  income: '#34d399',
  incomeInk: '#06281c',
  expense: '#fb7185',
  expenseInk: '#3a0613',
  balance: '#a78bfa',
  warn: '#fbbf24',
  neutral: '#64748b',
  heroFrom: '#6d28d9',
  heroTo: '#4338ca',
} as const;

/** Colores de las barras de "Gastos por categoría", por orden de monto. */
export const CATEGORY_BAR_COLORS = [
  '#fb7185',
  '#fbbf24',
  '#38bdf8',
  '#a78bfa',
  '#34d399',
  '#f472b6',
  '#60a5fa',
  '#94a3b8',
];

export const radius = { sm: 12, md: 14, lg: 18, xl: 22 } as const;
