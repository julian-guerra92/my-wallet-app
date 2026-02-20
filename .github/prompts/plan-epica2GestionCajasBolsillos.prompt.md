# Plan: Épica 2 — Gestión de Cajas y Bolsillos

## Análisis del estado actual

La Épica 1 está totalmente implementada: NextAuth v4 (Credentials + JWT), 2FA TOTP, middleware de rutas y `getAuthenticatedUserId()`. El modelo `Account` ya existe en `prisma/schema.prisma` con `name`, `isGoal`, `targetAmount`, `balance`, `userId`, y la migración inicial ya fue ejecutada.

**Decisiones técnicas validadas:**
- **Icono:** emoji libre — campo de texto corto (1-2 chars)
- **Color:** paleta fija de 8 swatches del tema `mywallet` (hex almacenado en BD)
- **Saldo inicial:** editable al crear la caja
- **Borrado:** archivado suave — campo `isArchived`, historial conservado
- **Fetching:** Server Components + Prisma directo para lecturas; API Routes para mutaciones

---

## Tareas

### ✅ Tarea 1 — Migración del schema: campos adicionales en `Account`

Agregar tres campos al modelo `Account` en `prisma/schema.prisma`:

```prisma
model Account {
  // ... campos existentes ...
  icon       String?  // Emoji libre, ej: "🏠", "💳"
  color      String?  // Hex del color elegido, ej: "#7c3aed"
  isArchived Boolean  @default(false)
}
```

Ejecutar:
```bash
npx prisma migrate dev --name add-account-extras
```

> Todos los queries filtrarán `isArchived: false` por defecto. Los registros archivados quedan en BD para conservar el historial de transacciones.

---

### ✅ Tarea 2 — API Route: listado y creación (`/api/cajas`)

Crear `src/app/api/cajas/route.ts` con dos handlers:

**`GET`** — Lista todas las cajas del usuario autenticado:
- Llama a `getAuthenticatedUserId()`
- Query: `prisma.account.findMany({ where: { userId, isArchived: false }, orderBy: { name: 'asc' } })`
- Retorna `200` con array de cajas, o `401` si no hay sesión válida

**`POST`** — Crea una nueva caja:
- Llama a `getAuthenticatedUserId()`
- Body esperado: `{ name, icon?, color?, balance, isGoal, targetAmount? }`
- Validaciones: `name` requerido; `balance` ≥ 0; si `isGoal === true`, `targetAmount` debe ser `> 0`
- Crea con `prisma.account.create({ data: { ...body, userId } })`
- Retorna `201` con la caja creada

---

### ✅ Tarea 3 — API Route: detalle, edición y archivado (`/api/cajas/[id]`)

Crear `src/app/api/cajas/[id]/route.ts` con tres handlers:

**`GET`** — Detalle de una caja:
- Verifica que la caja pertenece al `userId` de la sesión (never trust URL params)
- Retorna la caja o `404`

**`PUT`** — Edita una caja:
- Body: mismos campos que POST (todos opcionales)
- Verifica pertenencia por `userId` antes de actualizar
- Retorna la caja actualizada

**`DELETE`** — Archiva una caja (soft delete):
- Verifica pertenencia por `userId`
- Ejecuta `prisma.account.update({ where: { id }, data: { isArchived: true } })`
- Retorna `200`
- Si la caja ya está archivada, retorna `404` (no debe ser accesible)

---

### ✅ Tarea 4 — Componente: `ColorPicker`

Crear `src/components/ui/ColorPicker.tsx`:
- Recibe `value: string` y `onChange: (color: string) => void`
- Muestra una fila de swatches circulares con los colores del tema:

| Color | Hex |
|---|---|
| Primary (violeta) | `#7c3aed` |
| Secondary (cyan) | `#2dd4bf` |
| Accent (rosa) | `#f471b5` |
| Success (verde) | `#36d399` |
| Warning (amarillo) | `#fbbd23` |
| Error (rojo) | `#f87272` |
| Info (azul) | `#3abff8` |
| Neutro (sin color) | `#1e1e2e` |

- El swatch seleccionado muestra un borde/check visual
- Un swatch adicional "sin color" (neutro) como opción por defecto

---

### ✅ Tarea 5 — Componente: `CajaForm`

Crear `src/components/cajas/CajaForm.tsx`:
- Client Component (`"use client"`)
- Campos del formulario:
  1. **Nombre** — input texto, requerido
  2. **Icono** — input texto corto (emoji), placeholder `💳`, `maxLength={2}`
  3. **Color** — componente `ColorPicker` de la Tarea 4
  4. **Saldo inicial / actual** — input numérico, mínimo 0
  5. **¿Es Meta de Ahorro?** — DaisyUI `toggle` switch
  6. **Monto objetivo** — input numérico, visible solo si el switch anterior está activo, mínimo 1
- Props: `initialData?` (para modo edición), `onSubmit: (data) => Promise<void>`, `isLoading: boolean`
- Manejo de estado local con `useState`; validación inline antes del submit

---

### ✅ Tarea 6 — Componente: `CajaCard`

Crear `src/components/cajas/CajaCard.tsx`:
- Extiende el componente `Card` existente en `src/components/ui/Card.tsx`
- Contenido:
  - Emoji del icono + dot de color (indicador visual izquierdo)
  - Nombre de la caja
  - Saldo actual formateado (ej: `$ 1.250.000`)
  - Badge "Meta" si `isGoal === true`
  - Si es meta: barra de progreso simple con colores semáforo:
    - `< 50%` → `bg-error`
    - `50–79%` → `bg-warning`
    - `≥ 80%` → `bg-success`
  - Chip con porcentaje completado (ej: `72%`)
- Clickeable — navega a `/cajas/[id]`
- Botón de opciones (ícono `MoreVertical` de lucide) con menú: **Editar** / **Archivar**

---

### ✅ Tarea 7 — Página: Listado de Cajas (`/cajas`)

Crear `src/app/(app)/cajas/page.tsx`:
- Server Component — lee sesión y consulta Prisma directamente (sin fetch a API)
- Muestra lista de `CajaCard` por cada caja no archivada del usuario
- Si no hay cajas: estado vacío con mensaje + botón "Crear primera caja"
- Encabezado con título "Mis Cajas" + botón "+" (link a `/cajas/nueva`)
- Separación visual entre cajas normales y metas de ahorro (sección "Metas" al final)

---

### ✅ Tarea 8 — Página: Nueva Caja (`/cajas/nueva`)

Crear `src/app/(app)/cajas/nueva/page.tsx`:
- Client Component que renderiza `CajaForm`
- Al submit: `POST /api/cajas` con el body del formulario
- Si éxito: redirigir a `/cajas` con `router.push("/cajas")`
- Si error: mostrar mensaje de error devuelto por la API

---

### ✅ Tarea 9 — Página: Editar Caja (`/cajas/[id]/editar`)

Crear `src/app/(app)/cajas/[id]/editar/page.tsx`:
- Server Component — obtiene la caja directo con Prisma
- Verifica que la caja pertenece al usuario; si no, redirige a `/cajas`
- Renderiza `CajaForm` con `initialData` precargado
- Al submit (desde Client Component hijo): `PUT /api/cajas/[id]` con el body actualizado
- Si éxito: redirigir a `/cajas`

---

### ✅ Tarea 10 — Página: Detalle de Caja (`/cajas/[id]`)

Crear `src/app/(app)/cajas/[id]/page.tsx` como shell preparado para la Épica 3:
- Server Component — obtiene la caja del usuario directo con Prisma
- Muestra: nombre, emoji, color, saldo actual
- Si es meta: barra de progreso completa con semáforo y monto objetivo
- Sección "Movimientos" con estado vacío ("Aún no hay transacciones") — se llenará en Épica 3
- Botón flotante "Agregar movimiento" → link a `/agregar?cajaId=[id]` (base para Épica 3)
- Botón "Editar" en encabezado → link a `/cajas/[id]/editar`

---

### ✅ Tarea 11 — Actualizar el Home con datos reales

Actualizar `src/app/(app)/page.tsx`:
- **Saldo Total** — suma de `balance` de todas las cajas no archivadas del usuario (Server Component, Prisma directo)
- **Ingresos / Gastos** — quedan en `$0` hasta Épica 3 (no hay transacciones aún)
- **Sección "Reciente"** — reemplazar mocks por estado vacío si no hay transacciones
- **Saludo** — reemplazar "Gemini" por el email del usuario desde la sesión

> Esta tarea es parcial: ingresos/gastos serán reales desde la Épica 3. El saldo total sí será real desde esta épica.

---

## Criterios de verificación

1. Crear una caja con nombre, emoji, color y saldo inicial → aparece en `/cajas` con datos correctos
2. La tarjeta muestra correctamente el emoji, el dot de color y el saldo formateado
3. Crear una caja con "Es Meta de Ahorro" activado → muestra badge y barra de progreso (0% si saldo=0)
4. Editar una caja → cambios reflejados inmediatamente en el listado
5. Archivar una caja → desaparece del listado, permanece en BD con `isArchived: true`
6. El Saldo Total del Home refleja la suma real de los balances de las cajas activas
7. `GET /api/cajas` sin sesión válida → retorna `401`
8. Acceder a `/api/cajas/[id-de-otro-usuario]` con sesión válida → retorna `404`
9. `npm run build` completa sin errores de TypeScript

---

## Decisiones técnicas registradas

| Decisión | Elección | Justificación |
|---|---|---|
| Icono | Emoji libre (campo texto, `maxLength=2`) | Simple, sin dependencias extra; consistente con el estilo del home actual |
| Color | Paleta fija de 8 swatches | Mantiene coherencia visual con el tema `mywallet`; evita colores fuera de paleta |
| Saldo | Campo almacenado (`balance` en BD) | Se actualiza atómicamente al crear transacciones en Épica 3; eficiente para lecturas |
| Saldo inicial editable | Sí | Permite registrar cuentas bancarias existentes con saldo ya acumulado |
| Borrado | Archivado suave (`isArchived`) | Conserva integridad referencial con `Transaction`; el borrado cascada rompería la historia financiera |
| Fetching de páginas | Server Components + Prisma directo | Evita round-trip innecesario; aprovecha RSC del App Router de Next.js |
| Mutaciones | API Routes llamadas desde Client Components | Permite feedback de loading/error en el formulario sin recargar la página |
| Barra de progreso (metas) | Incluida desde esta épica | El dato ya existe (`balance` / `targetAmount`); incluirla ahora evita un refactor en Épica 4 |
