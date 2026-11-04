import React from 'react';
import { Text } from 'react-native';
import { useData } from '../state/DataContext';
import { colors } from '../theme/colors';

/** "☁️ Sincronizado" / "Sincronizando…" / "Sin conexión · 2 pendientes" / "Error de sincronización". */
export function SyncIndicator() {
  const { syncStatus, pendingCount } = useData();
  const pend = pendingCount ? ` · ${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}` : '';
  const map = {
    synced: { text: '☁️ Sincronizado', color: colors.income },
    syncing: { text: `🔄 Sincronizando${pend}`, color: colors.accent },
    offline: { text: `📴 Sin conexión${pend}`, color: colors.warn },
    error: { text: `⚠️ Error de sincronización${pend}`, color: colors.expense },
  } as const;
  const s = map[syncStatus];
  return (
    <Text style={{ color: s.color }} accessibilityLiveRegion="polite">
      {s.text}
    </Text>
  );
}
