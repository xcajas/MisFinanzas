// Campo de fecha: diálogo nativo en Android, calendario en hoja modal en iOS.
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { dateLabel, fromISODate, toISODate } from '../lib/format';
import { colors } from '../theme/colors';
import { PrimaryButton } from './ui';

export function DateField({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState(fromISODate(value));

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: fromISODate(value),
        mode: 'date',
        onChange: (e, d) => {
          if (e.type === 'set' && d) onChange(toISODate(d));
        },
      });
    } else {
      setDraft(fromISODate(value));
      setIosOpen(true);
    }
  };

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`Fecha ${dateLabel(value)}`} onPress={open} style={styles.input}>
        <Text style={styles.text}>📅 {dateLabel(value)}</Text>
      </Pressable>
      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <DateTimePicker
                value={draft}
                mode="date"
                display="inline"
                themeVariant="dark"
                accentColor={colors.accent}
                locale="es-EC"
                onChange={(_, d) => d && setDraft(d)}
              />
              <View style={{ paddingHorizontal: 8 }}>
                <PrimaryButton
                  title="Listo"
                  onPress={() => {
                    onChange(toISODate(draft));
                    setIosOpen(false);
                  }}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 13,
    padding: 14,
  },
  text: { color: colors.text, fontSize: 15 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 8,
    paddingBottom: 34,
  },
});
