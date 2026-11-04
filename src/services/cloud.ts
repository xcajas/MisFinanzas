// Acceso a Firestore. Estructura:
//   users/{uid}/transactions/{txId}  → movimiento
//   users/{uid}/budgets/{categoría}  → { amount, updatedAt }
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import type { Budgets, PendingOp, Transaction } from '../lib/types';

const txCol = (uid: string) => collection(getDb(), 'users', uid, 'transactions');
const budgetCol = (uid: string) => collection(getDb(), 'users', uid, 'budgets');

function toTransaction(id: string, d: Record<string, unknown>): Transaction | null {
  if ((d.type !== 'income' && d.type !== 'expense') || typeof d.amount !== 'number' || typeof d.date !== 'string') {
    return null;
  }
  return {
    id,
    type: d.type,
    amount: d.amount,
    description: String(d.description ?? ''),
    category: String(d.category ?? 'Otros'),
    date: d.date,
    createdAt: Number(d.createdAt ?? 0),
    updatedAt: Number(d.updatedAt ?? 0),
  };
}

/**
 * Escucha los movimientos y presupuestos en tiempo real. Solo se reportan snapshots
 * confirmados por el servidor (no los de caché en memoria del SDK), para que un arranque
 * sin internet nunca sobrescriba la caché local con datos vacíos.
 */
export function subscribeUserData(
  uid: string,
  handlers: {
    onTransactions: (txs: Record<string, Transaction>) => void;
    onBudgets: (b: Budgets) => void;
    onError: (e: FirestoreError) => void;
  },
): Unsubscribe {
  const u1 = onSnapshot(
    txCol(uid),
    (snap) => {
      if (snap.metadata.fromCache) return;
      const out: Record<string, Transaction> = {};
      snap.forEach((d) => {
        const t = toTransaction(d.id, d.data());
        if (t) out[t.id] = t;
      });
      handlers.onTransactions(out);
    },
    handlers.onError,
  );
  const u2 = onSnapshot(
    budgetCol(uid),
    (snap) => {
      if (snap.metadata.fromCache) return;
      const out: Budgets = {};
      snap.forEach((d) => {
        const amount = d.data().amount;
        if (typeof amount === 'number' && amount > 0) out[d.id] = amount;
      });
      handlers.onBudgets(out);
    },
    handlers.onError,
  );
  return () => {
    u1();
    u2();
  };
}

/** Ejecuta una operación pendiente contra Firestore. Todas son idempotentes. */
export async function pushOp(uid: string, op: PendingOp): Promise<void> {
  switch (op.kind) {
    case 'upsertTx': {
      const { id, ...data } = op.tx;
      await setDoc(doc(txCol(uid), id), data);
      return;
    }
    case 'deleteTx':
      await deleteDoc(doc(txCol(uid), op.id));
      return;
    case 'setBudget':
      if (op.amount > 0) await setDoc(doc(budgetCol(uid), op.category), { amount: op.amount, updatedAt: Date.now() });
      else await deleteDoc(doc(budgetCol(uid), op.category));
      return;
  }
}

/** Errores que no se arreglan reintentando: la operación se descarta. */
export const isPermanentError = (e: unknown) => {
  const code = (e as { code?: string })?.code ?? '';
  return ['permission-denied', 'invalid-argument', 'failed-precondition'].some((c) => code.endsWith(c));
};
