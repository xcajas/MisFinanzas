// Lógica pura de la caché offline: el estado visible = último estado del servidor
// + operaciones pendientes aplicadas encima. Sin dependencias de React ni Firebase.
import type { Budgets, PendingOp, Transaction } from './types';

export interface CacheState {
  serverTx: Record<string, Transaction>;
  serverBudgets: Budgets;
  queue: PendingOp[];
  lastSyncAt: number | null; // última vez que llegó un snapshot confirmado del servidor
}

export const emptyCache = (): CacheState => ({
  serverTx: {},
  serverBudgets: {},
  queue: [],
  lastSyncAt: null,
});

/** Aplica la cola sobre el estado del servidor. */
export function materialize(cache: CacheState): { txs: Record<string, Transaction>; budgets: Budgets } {
  const txs = { ...cache.serverTx };
  const budgets = { ...cache.serverBudgets };
  for (const op of cache.queue) {
    if (op.kind === 'upsertTx') txs[op.tx.id] = op.tx;
    else if (op.kind === 'deleteTx') delete txs[op.id];
    else if (op.amount > 0) budgets[op.category] = op.amount;
    else delete budgets[op.category];
  }
  return { txs, budgets };
}

const opKey = (op: PendingOp) =>
  op.kind === 'setBudget' ? `b:${op.category}` : `t:${op.kind === 'upsertTx' ? op.tx.id : op.id}`;

/**
 * Agrega una operación a la cola, compactando: solo vale la última operación
 * sobre el mismo movimiento o la misma categoría (todas son idempotentes).
 */
export function enqueue(queue: PendingOp[], op: PendingOp): PendingOp[] {
  const key = opKey(op);
  return [...queue.filter((o) => opKey(o) !== key), op];
}

export function dequeue(queue: PendingOp[], opId: string): PendingOp[] {
  return queue.filter((o) => o.opId !== opId);
}
