// Barra superior del prototipo: saludo + estado de sincronización, título y chip de mes.
// Tocar el saludo abre la hoja de cuenta (huella, sincronizar, cerrar sesión).
import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../state/AuthContext';
import { useData } from '../state/DataContext';
import { colors } from '../theme/colors';
import { MonthPicker } from './MonthPicker';
import { SyncIndicator } from './SyncIndicator';

function firstName(displayName: string | null | undefined, email: string | null | undefined) {
  const raw = (displayName || email?.split('@')[0] || '').split(/[\s._-]/)[0];
  return raw ? raw[0].toUpperCase() + raw.slice(1) : '';
}

function timeAgo(ts: number | null) {
  if (!ts) return 'nunca';
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`;
}

export function AppHeader({ showMonth = true }: { showMonth?: boolean }) {
  const { user } = useAuth();
  const [menu, setMenu] = useState(false);
  const name = firstName(user?.displayName, user?.email);

  return (
    <View style={styles.appbar}>
      <View style={styles.titleRow}>
        <Pressable
          onPress={() => setMenu(true)}
          accessibilityRole="button"
          accessibilityLabel="Cuenta y sincronización"
          style={{ flex: 1 }}
        >
          <Text style={styles.greet} numberOfLines={1}>
            Hola{name ? `, ${name}` : ''} 👋 · <SyncIndicator />
          </Text>
          <Text style={styles.title}>Mis Finanzas</Text>
        </Pressable>
        {showMonth ? <MonthPicker /> : null}
      </View>
      <AccountSheet visible={menu} onClose={() => setMenu(false)} />
    </View>
  );
}

function AccountSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user, biometric, biometricEnabled, setBiometricEnabled, signOut } = useAuth();
  const { pendingCount, syncNow, syncError, online, lastSyncAt } = useData();

  const status = !online
    ? 'Sin conexión: los cambios se guardan en el teléfono y se subirán al reconectar.'
    : (syncError ??
      (pendingCount ? `${pendingCount} cambio(s) por subir.` : 'Todo está respaldado en la nube.'));

  const confirmSignOut = () => {
    const warn = pendingCount
      ? `Tienes ${pendingCount} cambio(s) sin sincronizar que se perderán.`
      : 'Tus datos quedan respaldados en la nube.';
    Alert.alert('¿Cerrar sesión?', warn, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: () => {
          onClose();
          signOut();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.sheetTitle}>{user?.email}</Text>
          <Text style={styles.sheetSub}>{status}</Text>
          <Text style={styles.sheetSub}>Última sincronización: {timeAgo(lastSyncAt)}</Text>

          <SheetItem
            label="🔄 Sincronizar ahora"
            onPress={() => {
              syncNow();
              onClose();
            }}
          />
          {biometric.available ? (
            <SheetItem
              label={
                biometricEnabled
                  ? `🔓 Desactivar desbloqueo con ${biometric.label}`
                  : `🔒 Activar desbloqueo con ${biometric.label}`
              }
              onPress={async () => {
                await setBiometricEnabled(!biometricEnabled);
                onClose();
              }}
            />
          ) : null}
          <SheetItem label="Cerrar sesión" color={colors.expense} onPress={confirmSignOut} />
          <SheetItem label="Cancelar" color={colors.muted} onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SheetItem({ label, onPress, color = colors.text }: { label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.card2 }]}
    >
      <Text style={[styles.itemText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  appbar: { paddingTop: 6, paddingHorizontal: 20, paddingBottom: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  greet: { fontSize: 13, color: colors.muted },
  title: { fontSize: 21, fontWeight: '700', color: colors.text },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    paddingBottom: 34,
  },
  sheetTitle: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  sheetSub: { color: colors.muted, fontSize: 12, marginBottom: 4 },
  item: { paddingVertical: 14, paddingHorizontal: 6, borderRadius: 12, marginTop: 4 },
  itemText: { fontSize: 15, fontWeight: '600' },
});
