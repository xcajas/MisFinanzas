import { Tabs } from 'expo-router/js-tabs';
import React from 'react';
import { TabBar } from '../../components/TabBar';
import { colors } from '../../theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="movimientos" options={{ title: 'Movimientos' }} />
      <Tabs.Screen name="presupuesto" options={{ title: 'Presupuesto' }} />
      <Tabs.Screen name="agregar" options={{ title: 'Agregar' }} />
    </Tabs>
  );
}
