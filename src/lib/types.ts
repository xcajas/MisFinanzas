export type TxType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TxType;
  amount: number; // USD, siempre positivo
  description: string;
  category: string;
  date: string; // YYYY-MM-DD (fecha local)
  createdAt: number; // ms epoch
  updatedAt: number; // ms epoch
}

/** Tope mensual por categoría de gasto (USD). */
export type Budgets = Record<string, number>;

/** Operación pendiente de subir a Firestore (cola offline persistente). */
export type PendingOp =
  | { opId: string; kind: 'upsertTx'; tx: Transaction }
  | { opId: string; kind: 'deleteTx'; id: string }
  | { opId: string; kind: 'setBudget'; category: string; amount: number };

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';
