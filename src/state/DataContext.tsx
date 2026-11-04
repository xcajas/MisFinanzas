// Datos del usuario con caché local (AsyncStorage) + cola de sincronización con Firestore.
//
// - Todo cambio se aplica al instante en la caché local y se encola.
// - Con conexión, la cola se sube a Firestore en orden; sin conexión se guarda en el
//   dispositivo y se sube automáticamente al reconectarse (NetInfo) o al volver a la app.
// - Los snapshots del servidor actualizan la caché; los cambios pendientes se aplican encima.
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { randomUUID } from 'expo-crypto';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { currentMonth } from '../lib/format';
import { dequeue, emptyCache, enqueue, materialize, type CacheState } from '../lib/syncQueue';
import type { Budgets, PendingOp, SyncStatus, Transaction, TxType } from '../lib/types';
import { isPermanentError, pushOp, subscribeUserData } from '../services/cloud';

const cacheKey = (uid: string) => `mf:cache:v1:${uid}`;
const PUSH_TIMEOUT_MS = 20_000;
const RETRY_INTERVAL_MS = 30_000;

export async function clearLocalCache(uid: string) {
  await AsyncStorage.removeItem(cacheKey(uid));
}

type State = { loaded: boolean; cache: CacheState };
type Action =
  | { type: 'load'; cache: CacheState }
  | { type: 'serverTx'; txs: Record<string, Transaction> }
  | { type: 'serverBudgets'; budgets: Budgets }
  | { type: 'enqueue'; op: PendingOp }
  | { type: 'dequeue'; opId: string };

function reducer(state: State, a: Action): State {
  const c = state.cache;
  switch (a.type) {
    case 'load':
      return { loaded: true, cache: a.cache };
    case 'serverTx':
      return { ...state, cache: { ...c, serverTx: a.txs, lastSyncAt: Date.now() } };
    case 'serverBudgets':
      return { ...state, cache: { ...c, serverBudgets: a.budgets, lastSyncAt: Date.now() } };
    case 'enqueue':
      return { ...state, cache: { ...c, queue: enqueue(c.queue, a.op) } };
    case 'dequeue':
      return { ...state, cache: { ...c, queue: dequeue(c.queue, a.opId) } };
  }
}

export type TxInput = {
  id?: string;
  type: TxType;
  amount: number;
  description: string;
  category: string;
  date: string;
};

interface DataContextValue {
  ready: boolean;
  transactions: Transaction[];
  budgets: Budgets;
  getTransaction: (id: string) => Transaction | undefined;
  saveTransaction: (input: TxInput) => Transaction;
  deleteTransaction: (id: string) => void;
  setBudget: (category: string, amount: number) => void;
  // sincronización
  online: boolean;
  syncStatus: SyncStatus;
  pendingCount: number;
  lastSyncAt: number | null;
  syncError: string | null;
  syncNow: () => void;
  // mes seleccionado (compartido por Inicio, Movimientos y Presupuesto)
  month: string;
  setMonth: (m: string) => void;
}

const Ctx = createContext<DataContextValue | null>(null);

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export function DataProvider({ uid, children }: { uid: string; children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { loaded: false, cache: emptyCache() });
  const [online, setOnline] = useState(true);
  const [flushing, setFlushing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [month, setMonth] = useState(currentMonth());
  const [kick, setKick] = useState(0); // fuerza otra pasada de sincronización

  const cacheRef = useRef(state.cache);
  const onlineRef = useRef(online);
  const flushingRef = useRef(false);
  useLayoutEffect(() => {
    cacheRef.current = state.cache;
    onlineRef.current = online;
  });

  // 1) Cargar caché local del usuario.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(cacheKey(uid))
      .then((raw) => {
        if (!alive) return;
        let cache = emptyCache();
        if (raw) {
          try {
            cache = { ...cache, ...JSON.parse(raw) };
          } catch {}
        }
        dispatch({ type: 'load', cache });
      })
      .catch(() => alive && dispatch({ type: 'load', cache: emptyCache() }));
    return () => {
      alive = false;
    };
  }, [uid]);

  // 2) Persistir la caché en cada cambio.
  useEffect(() => {
    if (state.loaded) AsyncStorage.setItem(cacheKey(uid), JSON.stringify(state.cache)).catch(() => {});
  }, [state.cache, state.loaded, uid]);

  // 3) Estado de la red.
  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => {
      setOnline(s.isConnected !== false && s.isInternetReachable !== false);
    });
    return unsub;
  }, []);

  // 4) Escuchar Firestore (el SDK reconecta solo cuando vuelve la red).
  useEffect(() => {
    if (!state.loaded) return;
    return subscribeUserData(uid, {
      onTransactions: (txs) => {
        dispatch({ type: 'serverTx', txs });
        setSyncError(null);
      },
      onBudgets: (budgets) => dispatch({ type: 'serverBudgets', budgets }),
      onError: (e) => setSyncError(e.code === 'permission-denied' ? 'Sin permiso en Firestore (revisa las reglas)' : e.message),
    });
  }, [uid, state.loaded]);

  // 5) Subir la cola de cambios pendientes, en orden.
  const flush = useCallback(async () => {
    if (flushingRef.current || !onlineRef.current) return;
    flushingRef.current = true;
    setFlushing(true);
    const done = new Set<string>(); // operaciones ya subidas en esta pasada
    let failed = false;
    try {
      for (;;) {
        const op = cacheRef.current.queue.find((o) => !done.has(o.opId));
        if (!op || !onlineRef.current) break;
        try {
          await withTimeout(pushOp(uid, op), PUSH_TIMEOUT_MS);
          done.add(op.opId);
          dispatch({ type: 'dequeue', opId: op.opId });
        } catch (e) {
          if (isPermanentError(e)) {
            done.add(op.opId);
            dispatch({ type: 'dequeue', opId: op.opId });
            setSyncError('Un cambio fue rechazado por el servidor y se descartó.');
            continue;
          }
          failed = true;
          setSyncError('No se pudo sincronizar. Se reintentará automáticamente.');
          break;
        }
      }
    } finally {
      flushingRef.current = false;
      setFlushing(false);
    }
    // Cambios hechos mientras se subía la cola: otra pasada cuando React haya confirmado el estado.
    if (!failed) {
      setTimeout(() => {
        if (cacheRef.current.queue.some((o) => !done.has(o.opId))) setKick((k) => k + 1);
      }, 50);
    }
  }, [uid]);
  // Disparadores de sincronización: cambios en la cola, reconexión, volver a la app, intervalo.
  const queueLen = state.cache.queue.length;
  useEffect(() => {
    if (state.loaded && online && queueLen > 0) flush();
  }, [state.loaded, online, queueLen, kick, flush]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') NetInfo.fetch().then(() => flush());
    });
    const timer = setInterval(() => {
      if (cacheRef.current.queue.length) flush();
    }, RETRY_INTERVAL_MS);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, [flush]);

  // --- API pública ---
  const { txs, budgets } = useMemo(() => materialize(state.cache), [state.cache]);
  const transactions = useMemo(() => Object.values(txs), [txs]);

  const saveTransaction = useCallback((input: TxInput): Transaction => {
    const now = Date.now();
    const prev = input.id ? materialize(cacheRef.current).txs[input.id] : undefined;
    const tx: Transaction = {
      id: input.id ?? randomUUID(),
      type: input.type,
      amount: Math.round(input.amount * 100) / 100,
      description: input.description.trim() || input.category,
      category: input.category,
      date: input.date,
      createdAt: prev?.createdAt ?? now,
      updatedAt: now,
    };
    dispatch({ type: 'enqueue', op: { opId: randomUUID(), kind: 'upsertTx', tx } });
    return tx;
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    dispatch({ type: 'enqueue', op: { opId: randomUUID(), kind: 'deleteTx', id } });
  }, []);

  const setBudget = useCallback((category: string, amount: number) => {
    const v = Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : 0;
    dispatch({ type: 'enqueue', op: { opId: randomUUID(), kind: 'setBudget', category, amount: v } });
  }, []);

  const pendingCount = state.cache.queue.length;
  let syncStatus: SyncStatus;
  if (!online) syncStatus = 'offline';
  else if (syncError && !flushing) syncStatus = 'error';
  else if (flushing || pendingCount > 0 || state.cache.lastSyncAt === null) syncStatus = 'syncing';
  else syncStatus = 'synced';

  const value: DataContextValue = {
    ready: state.loaded,
    transactions,
    budgets,
    getTransaction: (id) => txs[id],
    saveTransaction,
    deleteTransaction,
    setBudget,
    online,
    syncStatus,
    pendingCount,
    lastSyncAt: state.cache.lastSyncAt,
    syncError,
    syncNow: () => {
      setSyncError(null);
      NetInfo.fetch().then(() => flush());
    },
    month,
    setMonth,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): DataContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData debe usarse dentro de <DataProvider>');
  return v;
}
