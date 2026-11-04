# Configurar Firebase para Mis Finanzas

Esta guía deja listo el backend: **Authentication** (correo y contraseña) y **Cloud Firestore**
(movimientos y presupuestos). Toma unos 10 minutos. Solo necesitas una cuenta de Google.

> El nombre de los menús puede variar un poco según la versión de la consola de Firebase.

---

## 1. Crear el proyecto

1. Entra a <https://console.firebase.google.com> y pulsa **Crear un proyecto**.
2. Ponle un nombre, por ejemplo `mis-finanzas`. Google Analytics no hace falta.
3. Espera a que termine y entra al proyecto.

## 2. Registrar una app web (para obtener la configuración)

La app usa el **SDK JavaScript de Firebase**, que funciona igual en iOS y Android. Por eso se registra
una app **Web** y no hacen falta `google-services.json` ni `GoogleService-Info.plist`.

1. En **Descripción general del proyecto**, pulsa el ícono **`</>`** (Web).
2. Apodo: `mis-finanzas-app`. **No** marques Firebase Hosting.
3. Firebase muestra un bloque `firebaseConfig`. Copia esos valores al archivo `.env` del proyecto:

```bash
cp .env.example .env
```

| Campo de `firebaseConfig` | Variable en `.env` |
| --- | --- |
| `apiKey` | `EXPO_PUBLIC_FIREBASE_API_KEY` |
| `authDomain` | `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `EXPO_PUBLIC_FIREBASE_PROJECT_ID` |
| `storageBucket` | `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `EXPO_PUBLIC_FIREBASE_APP_ID` |

Si después pierdes estos valores, están en ⚙️ **Configuración del proyecto → General → Tus apps**.

> **¿Es seguro que la `apiKey` vaya dentro de la app?** Sí. En Firebase la `apiKey` solo identifica
> el proyecto, no da acceso a nada. Lo que protege los datos son las **reglas de Firestore**
> (paso 5) y el bloqueo de registros nuevos (paso 3.4). Igual, `.env` está en `.gitignore`.

## 3. Activar el login con correo y contraseña

1. Menú **Compilación → Authentication → Comenzar**.
2. Pestaña **Método de acceso**, elige **Correo electrónico/contraseña**, actívalo (solo la primera opción, no
   "vínculo de correo electrónico") y guarda.
3. Pestaña **Usuarios → Agregar usuario**: escribe tu correo y una contraseña segura. Esa será tu cuenta
   en la app. La app no tiene pantalla de registro porque es para una sola persona.
4. **Recomendado:** pestaña **Configuración → Acciones del usuario**, desmarca
   **Habilitar la creación (registro)**. Así nadie más puede crear cuentas en tu proyecto.
5. Opcional: en **Plantillas**, cambia el idioma a **Español** para que el correo de
   "¿Olvidaste tu contraseña?" llegue en español.

## 4. Crear la base de datos Firestore

1. Menú **Compilación → Firestore Database → Crear base de datos**.
2. Edición **Standard**. Ubicación: una cercana a ti, por ejemplo `southamerica-east1` (São Paulo) o
   `nam5` (EE. UU.). **La ubicación no se puede cambiar después.**
3. Elige **Iniciar en modo de producción** (todo cerrado). En el siguiente paso pones las reglas.

No hace falta crear colecciones a mano: la app las crea al guardar el primer movimiento.

```
users/{uid}/transactions/{id}   { type, amount, description, category, date, createdAt, updatedAt }
users/{uid}/budgets/{categoría} { amount, updatedAt }
```

## 5. Publicar las reglas de seguridad

Las reglas están en [`firebase/firestore.rules`](../firebase/firestore.rules). Cada usuario solo puede leer
y escribir dentro de `users/{su uid}`, y además se valida la forma de los datos.

**Opción A: desde la consola (más fácil)**

1. **Firestore Database → Reglas**.
2. Borra lo que haya, pega el contenido de `firebase/firestore.rules` y pulsa **Publicar**.

**Opción B: con la CLI de Firebase**

```bash
npm install -g firebase-tools
```

```bash
firebase login
```

```bash
cp .firebaserc.example .firebaserc
```

Edita `.firebaserc` y pon tu `projectId`. Luego publica:

```bash
firebase deploy --only firestore:rules
```

## 6. Probar

```bash
npx expo start -c
```

Usa `-c` la primera vez, o cada vez que cambies `.env`: limpia la caché de Metro para que tome las
variables nuevas. Ingresa con el usuario que creaste en el paso 3.3. Agrega un movimiento y revisa
**Firestore Database → Datos**: debe aparecer `users/<uid>/transactions/...`.

---

## Problemas comunes

| Síntoma | Causa y solución |
| --- | --- |
| La app muestra "Falta configurar Firebase" | `.env` no existe o está incompleto. Revisa el paso 2 y reinicia con `npx expo start -c`. |
| "Correo o contraseña incorrectos" | El usuario no existe en Authentication → Usuarios, o la contraseña es otra. |
| El indicador dice "⚠️ Error de sincronización" / "Sin permiso en Firestore" | Las reglas no están publicadas o son distintas a `firebase/firestore.rules`. |
| "Sin conexión. Necesitas internet para el primer ingreso…" | El primer ingreso con contraseña requiere internet. Después la sesión queda guardada y la app funciona sin conexión. |
| Cambié `.env` y no pasa nada | Reinicia Metro con `npx expo start -c`. |

## Costos

Para una sola persona el uso queda muy por debajo del plan gratuito **Spark**
(50 000 lecturas y 20 000 escrituras de Firestore al día). No hace falta tarjeta de crédito.
