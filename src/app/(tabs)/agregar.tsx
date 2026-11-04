import { router } from 'expo-router';
import React from 'react';
import { Screen } from '../../components/Screen';
import { TransactionForm } from '../../components/TransactionForm';
import { SectionHeader } from '../../components/ui';
import { useData } from '../../state/DataContext';

export default function AddScreen() {
  const { setMonth } = useData();
  return (
    <Screen>
      <SectionHeader title="Nuevo movimiento" />
      <TransactionForm
        onSaved={(tx) => {
          // Como en el prototipo: mostrar el mes del movimiento y volver a Inicio.
          setMonth(tx.date.slice(0, 7));
          router.navigate('/');
        }}
      />
    </Screen>
  );
}
