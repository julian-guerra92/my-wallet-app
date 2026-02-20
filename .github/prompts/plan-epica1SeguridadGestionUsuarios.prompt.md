# Plan: Épica 1 — Seguridad y Gestión de Usuarios

## Análisis del estado actual

El proyecto tiene un scaffold visual funcional: Next.js 16 + React 19 + Tailwind CSS 4 + DaisyUI 5, con un `layout.tsx`, un `BottomNav` y un `page.tsx` estático. No existe backend, ni base de datos, ni ninguna capa de autenticación. Hay además una referencia a `/manifest.json` en `layout.tsx` que aún no existe en `public/`.

Las decisiones técnicas de base son:
- **DB:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js v5 (Auth.js) con Credentials Provider
- **Registro:** script de seed manual
- **2FA setup:** script que genera el secret y lo guarda en la BD

---

## Paquetes a instalar

Los siguientes paquetes no están en `package.json` y son necesarios para la épica:

| Paquete | Versión recomendada | Propósito |
|---|---|---|
| `prisma` | ^6.x | ORM + CLI de migraciones |
| `@prisma/client` | ^6.x | Cliente de BD generado |
| `next-auth` | ^5.x (beta) | Auth.js para Next.js |
| `@auth/prisma-adapter` | ^2.x | Adaptador Prisma para NextAuth |
| `bcryptjs` | ^2.x | Hashing de contraseñas |
| `@types/bcryptjs` | ^2.x | Tipos para bcryptjs |
| `otplib` | ^12.x | Generación y validación TOTP (2FA) |
| `qrcode` | ^1.x | Generación de QR para seed script |
| `@types/qrcode` | — | Tipos para qrcode |

---

## Tareas

### Tarea 1 — Configuración de entorno y variables ✅ Hecho

Crear `.env` en la raíz con las variables:
- `DATABASE_URL` — connection string de PostgreSQL
- `NEXTAUTH_SECRET` — string aleatorio, mínimo 32 caracteres
- `NEXTAUTH_URL` — `http://localhost:3000` en desarrollo

Agregar `.env` al `.gitignore`.

---

### Tarea 2 — Schema de Prisma ✅ Hecho

Crear `prisma/schema.prisma` con el datasource apuntando a PostgreSQL y los modelos definidos en los requerimientos:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  password     String
  twoFaSecret  String?
  accounts     Account[]
}

model Account {
  id           String        @id @default(uuid())
  name         String
  isGoal       Boolean       @default(false)
  targetAmount Float?
  balance      Float         @default(0)
  userId       String
  user         User          @relation(fields: [userId], references: [id])
  transactions Transaction[]
}

model Transaction {
  id          String   @id @default(uuid())
  amount      Float
  type        String   // "INCOME" | "EXPENSE"
  description String
  date        DateTime @default(now())
  accountId   String
  account     Account  @relation(fields: [accountId], references: [id])
}
```

> **Decisión:** se usa JWT strategy puro en NextAuth. No se crean tablas adicionales de sesión (`Session`, `VerificationToken`) — más simple y suficiente para uso personal.

---

### Tarea 3 — Primera migración ✅ Hecho

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

### Tarea 4 — Singleton del cliente Prisma ✅ Hecho

Crear `src/lib/prisma.ts` con el patrón de singleton para evitar múltiples conexiones durante HMR en desarrollo:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["query"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

### Tarea 5 — Script de seed de usuario + secret 2FA ✅ Hecho

Crear `prisma/seed.ts`. El script debe:
1. Hashear la contraseña con `bcryptjs`
2. Generar un secret TOTP con `otplib.authenticator.generateSecret()`
3. Insertar el usuario con `prisma.user.create()`
4. Imprimir en consola el secret y la URL de provisioning `otpauth://totp/...` lista para importar manualmente en Google Authenticator o Authy

```bash
npx tsx prisma/seed.ts
```

> El secret **no** se configura desde la app. Se copia la URL `otpauth://` impresa en consola y se escanea / importa en la app autenticadora.

---

### Tarea 6 — Configuración de NextAuth v4 ✅ Hecho

Crear `src/auth.ts` (punto central de NextAuth v5):

- `providers: [Credentials({ ... })]`
- Callback `authorize`: buscar usuario por email → validar password con `bcryptjs.compare()` → retornar `{ id, email, is2FAVerified: false }`
- `session: { strategy: "jwt" }`
- Callbacks `jwt` y `session` para propagar `is2FAVerified` y `userId` al token/sesión

Crear `src/app/api/auth/[...nextauth]/route.ts` que exporta `GET` y `POST` del handler.

---

### Tarea 7 — Middleware de protección de rutas ✅ Hecho

Crear `src/middleware.ts`:

| Condición | Acción |
|---|---|
| Path es `/login` o `/verify-2fa` | Dejar pasar siempre |
| Sin sesión | Redirigir a `/login` |
| Sesión con `is2FAVerified === false` | Redirigir a `/verify-2fa` |
| Sesión válida y 2FA verificado | Dejar pasar |

Usar el `matcher` de Next.js para excluir rutas estáticas (`/_next`, `/public`, `favicon.ico`).

---

### Tarea 8 — Página de Login (HU-01) ✅ Hecho

Crear el grupo de rutas `(auth)` con su propio layout (sin `BottomNav`, centrado verticalmente):
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx`

La página de login debe:
- Ser un formulario client-side (`"use client"`)
- Tener campos `email` y `password`
- Al submit: llamar `signIn("credentials", { redirect: false })` → redirigir a `/verify-2fa` si éxito
- Mostrar error genérico ("Credenciales inválidas") sin revelar si el email existe

---

### Tarea 9 — Página de verificación 2FA (HU-02) ✅ Hecho

Crear `src/app/(auth)/verify-2fa/page.tsx`:
- Input numérico de 6 dígitos (`inputmode="numeric"`, `maxLength={6}`)
- Al submit: llamar a `POST /api/auth/verify-2fa`

Crear `src/app/api/auth/verify-2fa/route.ts`:
1. Leer sesión con `auth()` de NextAuth
2. Buscar `twoFaSecret` del usuario en BD
3. Validar con `otplib.authenticator.verify({ token, secret })`
4. Si válido: marcar `is2FAVerified = true` en el JWT y redirigir a `/`
5. Si inválido: retornar `401`

---

### Tarea 10 — Helper de aislamiento de datos (HU-03) ✅ Hecho

Crear `src/lib/auth-helpers.ts` con `getAuthenticatedUserId()`:
- Llama a `auth()` de NextAuth
- Retorna el `userId` del JWT si la sesión es válida y `is2FAVerified === true`
- Lanza un error 401 en cualquier otro caso

> **Convención:** todas las API Routes y Server Actions futuras deben iniciar invocando este helper. El `userId` **siempre** se obtiene del JWT, nunca de parámetros enviados por el cliente.

---

### Tarea 11 — Corrección de `manifest.json` faltante ✅ Hecho

Crear `public/manifest.json` básico de PWA:

```json
{
  "name": "Mi Billetera",
  "short_name": "Billetera",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#7c3aed",
  "icons": []
}
```

Esto elimina el warning de referencia en `src/app/layout.tsx`.

---

## Criterios de verificación

1. `npm run build` completa sin errores de TypeScript ni rutas faltantes
2. Acceder a `/` sin sesión → redirige a `/login`
3. Credenciales incorrectas → mensaje de error genérico (sin revelar si el email existe)
4. Credenciales correctas → redirige a `/verify-2fa`
5. Código 2FA incorrecto → error; código correcto → redirige a `/` y muestra el home
6. Con sesión activa, ir a `/login` → redirige al home
7. Cualquier `fetch` a una API route sin token válido retorna `401`
8. DevTools: cookie de sesión es `httpOnly` y `Secure` (en producción)

---

## Decisiones técnicas registradas

| Decisión | Elección | Justificación |
|---|---|---|
| BD | PostgreSQL | Seleccionado por el usuario |
| Auth strategy | JWT puro (sin Prisma Adapter de sesiones) | Evita tablas extras; suficiente para uso personal |
| Librería de passwords | `bcryptjs` | JavaScript puro; sin problemas de compilación de módulos nativos |
| Librería TOTP | `otplib` | Open source, zero cost, compatible con Google Authenticator y Authy |
| Setup 2FA | Script de seed (offline) | Alineado con la decisión del usuario; no requiere UI de onboarding |
| Registro de usuarios | Script de seed manual | Sin pantalla de registro pública |
| Grupo de rutas `(auth)` | Separado del layout principal | Evita que `BottomNav` aparezca en páginas públicas |
