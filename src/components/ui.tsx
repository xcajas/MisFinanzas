// Piezas pequeñas reutilizables, con los estilos del prototipo.
import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { levelColor, type Level } from '../lib/finance';
import { colors } from '../theme/colors';

export function Panel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.secH}>
      <Text style={styles.secHText}>{title}</Text>
      {right}
    </View>
  );
}

export function Tag({ level, label }: { level: Level; label: string }) {
  if (!label) return null;
  const c = levelColor[level];
  return (
    <View style={[styles.tag, { backgroundColor: hexAlpha(c, 0.16) }]}>
      <Text style={[styles.tagText, { color: c }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const w = Math.max(0, Math.min(pct, 100));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${w}%`, backgroundColor: color }]} />
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  color = colors.accent,
  textColor = colors.accentInk,
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: color, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

export function Empty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

/** "#rrggbb" + alfa → "rgba(r,g,b,a)" */
export function hexAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  secH: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginHorizontal: 2,
    marginBottom: 10,
  },
  secHText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginTop: 6 },
  tagText: { fontSize: 10, fontWeight: '700' },
  track: { height: 8, backgroundColor: colors.card2, borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6 },
  btn: { borderRadius: 15, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  btnText: { fontWeight: '800', fontSize: 15 },
  empty: { textAlign: 'center', color: colors.muted, paddingVertical: 30, paddingHorizontal: 10, fontSize: 13 },
});
