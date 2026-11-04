# 💰 Mis Finanzas

App móvil de finanzas personales para una sola persona, con login y respaldo en la nube.
Hecha con **React Native + Expo (SDK 58)** para iOS y Android, con **Firebase Authentication**, **Cloud Firestore**
y desbloqueo con **huella / Face ID**. Funciona sin internet y sincroniza al reconectarse.

Moneda: USD · Idioma: español · Diseño: basado en el prototipo aprobado (tema oscuro).

## Funciones

| Pantalla | Qué hace |
| --- | --- |
| **Login** | Correo y contraseña (Firebase Auth), "Ingresar con huella / Face ID" y "¿Olvidaste tu contraseña?" (envía el correo de restablecimiento). |
| **Inicio** | Balance del mes, ingresos, gastos, tasa de ahorro (Saludable / Ajustado / Déficit), % de presupuesto usado (En control / Al límite / Excedido), gastos por categoría e indicador de sincronización. |
| **Agregar** (`+` central o pestaña) | Toggle ingreso/gasto, monto, descripción, categoría con íconos y fecha. Si un gasto acerca o pasa el tope de su categoría, muestra una alerta. |
| **Movimientos** | Lista del mes elegido. Toca un movimiento para editarlo; `×` (o mantener presionado) para eliminarlo. |
| **Presupuesto** | Tope mensual por categoría con barra verde (< 80 %), amarilla (80–100 %) o roja (> 100 %). |
| **Selector de mes** | Chip en la barra superior, compartido por Inicio, Movimientos y Presupuesto. |
| **Cuenta** (tocar "Hola, …") | Estado de sincronización, "Sincronizar ahora", activar o desactivar la huella, cerrar sesión. |

Categorías de gasto: Vivienda 🏠, Alimentación 🛒, Transporte 🚗, Servicios 💡, Salud 💊, Educación 📚, Ocio 🎬, Otros 📦.
Categorías de ingreso: Sueldo 💼, Freelance 💻, Inversiones 📈, Otros ➕.

## Puesta en marcha

Requisitos: Node.js 20 o superior y la app **Expo Go** (SDK 58) en tu teléfono, o un emulador.

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Configura Firebase siguiendo **[docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)**. En resumen: crear el proyecto,
   activar correo y contraseña, crear tu usuario, crear Firestore, publicar las reglas y copiar la configuración:

   ```bash
   cp .env.example .env
   ```

3. Arranca la app:

   ```bash
   npx expo start
   ```

   Escanea el QR con Expo Go (Android) o con la cámara (iOS). También puedes pulsar `a` (emulador Android) o
   `i` (simulador iOS). Si cambias `.env`, reinicia con `npx expo start -c`.

### Huella / Face ID

- **Android (Expo Go o build):** la huella funciona directamente.
- **iOS:** Expo Go no incluye el permiso de Face ID de esta app, así que iOS ofrece el código del dispositivo.
  Para Face ID real, genera una build propia con el permiso `NSFaceIDUsageDescription` (ya configurado en `app.json`):

  ```bash
  npx eas-cli@latest build --profile preview --platform ios
  ```

  Para el perfil `development` de `eas.json`, instala antes el cliente de desarrollo:

  ```bash
  npx expo install expo-dev-client
  ```

El desbloqueo biométrico se ofrece después del primer ingreso con contraseña. Si está activo, la app se bloquea
al abrirse y tras 60 s en segundo plano. Se puede activar o desactivar desde la hoja de cuenta.

## Cómo funciona sin internet

```
 Pantallas ──► DataContext ──► caché local (AsyncStorage)
                    │              ├─ último estado del servidor
                    │              └─ cola de cambios pendientes
                    ▼
              Firestore  ◄── se sube la cola en orden cuando hay red (NetInfo)
                    │
                    └──► onSnapshot en tiempo real ──► actualiza la caché
```

- La sesión de Firebase Auth queda guardada en el dispositivo, así que la app abre sin conexión.
- Cada cambio (crear, editar, eliminar, tope) se aplica al instante en pantalla y se guarda en una **cola persistente**.
  Si cierras la app sin internet, los cambios no se pierden.
- Al reconectarse, al volver a la app o cada 30 s, la cola se sube en orden. Todas las operaciones son idempotentes
  (`setDoc` / `deleteDoc` con IDs generados en el teléfono), así que reintentar es seguro.
- Los snapshots que vienen solo de la caché del SDK se ignoran, para que un arranque sin red nunca borre los datos locales.
- El indicador de la barra superior muestra **☁️ Sincronizado**, **🔄 Sincronizando · N pendientes**,
  **📴 Sin conexión · N pendientes** o **⚠️ Error de sincronización**.

## Estructura del proyecto

```
mis-finanzas/
├── app.json                  Configuración de Expo (nombre, permisos de Face ID, plugins)
├── eas.json                  Perfiles de build con EAS
├── .env.example              Variables de Firebase (copiar como .env)
├── firebase.json             Para desplegar reglas con la CLI de Firebase
├── firebase/
│   ├── firestore.rules       Reglas de seguridad (solo el dueño accede a sus datos)
│   └── firestore.indexes.json
├── docs/FIREBASE_SETUP.md    Guía de configuración de Firebase
└── src/
    ├── app/                  Rutas (Expo Router)
    │   ├── _layout.tsx       Proveedores y protección de rutas según la sesión
    │   ├── login.tsx         Login + huella
    │   ├── (tabs)/           Pestañas: index (Inicio), movimientos, presupuesto, agregar
    │   └── editar/[id].tsx   Editar o eliminar un movimiento (modal)
    ├── components/           Encabezado, barra de pestañas con +, selector de mes, formulario, etc.
    ├── constants/            Categorías e íconos
    ├── lib/                  Firebase, formato USD/fechas, cálculos del mes, cola offline (lógica pura)
    ├── services/             Firestore (lectura/escritura) y biometría
    ├── state/                AuthContext (sesión + bloqueo) y DataContext (caché + sync)
    └── theme/                Colores del prototipo
```

## Scripts

```bash
npm start            # expo start
npm run typecheck    # tsc --noEmit
npm run lint         # expo lint
```

## Notas

- Sin backend propio: todo es Firebase, dentro del plan gratuito Spark para un solo usuario.
- Los topes de presupuesto son mensuales y se aplican a cualquier mes. El % se calcula con los gastos del mes elegido.
- Al cerrar sesión se borra la caché local del dispositivo. Los datos siguen en Firestore.
