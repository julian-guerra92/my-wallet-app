# My Wallet App

Aplicacion web de finanzas personales construida con Next.js, Prisma y PostgreSQL.

Incluye autenticacion con email/password + 2FA (TOTP), gestion de cajas/bolsillos, metas de ahorro, transacciones, plantillas y soporte PWA.

## Funcionalidades actuales

- Login con credenciales y segundo paso 2FA.
- Aislamiento de datos por usuario autenticado.
- Gestion de cajas:
  - Cajas propias.
  - Cajas de terceros.
  - Cajas de metas de ahorro.
- Registro y edicion de transacciones por caja.
- Plantillas de transaccion para carga rapida.
- Dashboard principal con:
  - Balance liquido (excluye metas y terceros).
  - Ingresos y gastos del mes.
  - Historial global paginado.
- Dashboard de metas con progreso.
- PWA con manifest e iconos, y Service Worker via Serwist.

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Prisma 7 + PostgreSQL
- NextAuth (Credentials)
- 2FA TOTP con otplib
- Tailwind CSS 4 + DaisyUI
- PWA con @serwist/next

## Requisitos

- Node.js 20+
- npm
- PostgreSQL accesible desde la app

## Variables de entorno

Crea un archivo `.env` en la raiz del proyecto con:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME"
NEXTAUTH_SECRET="tu_secret_largo_y_seguro"
NEXTAUTH_URL="http://localhost:3000"
```

Notas:

- `DATABASE_URL` es obligatoria para Prisma.
- `NEXTAUTH_SECRET` es obligatoria para JWT/sesion en NextAuth.
- `NEXTAUTH_URL` es recomendada en local y necesaria en despliegue.

## Instalacion y arranque

1. Instalar dependencias:

```bash
npm install
```

2. Aplicar migraciones en tu base de datos:

```bash
npx prisma migrate dev
```

3. (Opcional) Sembrar usuario inicial:

```bash
npx prisma db seed
```

Importante: antes de correr el seed, revisa `prisma/seed.ts` y ajusta email/password para tu entorno.

4. Levantar en desarrollo:

```bash
npm run dev
```

App local: http://localhost:3000

## Scripts

- `npm run dev`: inicia Next en desarrollo con Webpack.
- `npm run build`: genera Prisma Client y compila para produccion con Webpack.
- `npm run start`: inicia la app en modo produccion.
- `npm run lint`: ejecuta ESLint.

## Autenticacion y acceso

Flujo actual:

1. Login en `/login` con email/password.
2. Verificacion de codigo TOTP en `/verify-2fa`.
3. Acceso a rutas protegidas al marcar la sesion como 2FA verificada.

El middleware bloquea rutas privadas si no existe sesion valida o no se completo 2FA.

## PWA (manifest + service worker)

La app esta configurada como PWA con:

- Manifest: `public/manifest.json`
- Worker fuente: `src/app/sw.ts`
- Integracion Serwist: `next.config.ts`

Iconos configurados en manifest:

- 48x48, 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 256x256, 384x384, 512x512.

### Validacion recomendada

En modo produccion local:

```bash
npm run build
npm run start
```

Luego, en Chrome/Edge DevTools:

1. `Application > Manifest`
	- Verifica nombre, `start_url`, `theme_color` e iconos sin errores.
2. `Application > Service Workers`
	- Verifica worker registrado y estado `activated and is running`.
3. `Network`
	- Verifica respuesta `200` para `/manifest.json` y `/sw.js`.

Nota tecnica: `@serwist/next` no trabaja con Turbopack en esta configuracion, por eso los scripts usan `--webpack`.

## Estructura general

- `src/app/(auth)`: pantallas de login y 2FA.
- `src/app/(app)`: app autenticada (home, cajas, metas, perfil, transacciones, plantillas).
- `src/app/api`: endpoints para auth, cajas, transacciones y plantillas.
- `src/components`: componentes de UI y modulos por dominio.
- `src/lib`: helpers de auth, formato, Prisma y logica financiera.
- `prisma`: schema, migraciones y seed.

## Estado del proyecto

Proyecto activo y en evolucion incremental por historias de usuario.

Si agregas nuevas funcionalidades, actualiza este README para mantenerlo sincronizado con el comportamiento real de la app.
