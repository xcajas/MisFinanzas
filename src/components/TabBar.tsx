// Barra de pestañas inferior del prototipo con el botón "+" flotante central.
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const ITEMS: { name: string; label: string; icon: string }[] = [
  { name: 'index', label: 'Inicio', icon: '🏠' },
  { name: 'movimientos', label: 'Movim.', icon: '📋' },
  { name: 'presupuesto', label: 'Presup.', icon: '🎯' },
  { name: 'agregar', label: 'Agregar', icon: '➕' },
];

export function TabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const active = state.routes[state.index]?.name;
  const go = (name: string) => {
    const r = state.routes.find((x) => x.name === name);
    if (r) navigateToTab(r.key);
  };

  return (
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 12) + 10 }]}>
      {ITEMS.map((it) => {
        const on = active === it.name;
        return (
          <Pressable
            key={it.name}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={it.label}
            onPress={() => go(it.name)}
            style={styles.btn}
          >
            <Text style={[styles.icon, { opacity: on ? 1 : 0.7 }]}>{it.icon}</Text>
            <Text style={[styles.label, on && { color: colors.accent }]}>{it.label}</Text>
          </Pressable>
        );
      })}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Agregar movimiento"
        onPress={() => go('agregar')}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  btn: { flex: 1, alignItems: 'center', gap: 3 },
  icon: { fontSize: 20 },
  label: { fontSize: 10, color: colors.muted },
  fab: {
    position: 'absolute',
    top: -24,
    left: '50%',
    marginLeft: -29,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent,
    borderWidth: 5,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  fabText: { color: colors.accentInk, fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
