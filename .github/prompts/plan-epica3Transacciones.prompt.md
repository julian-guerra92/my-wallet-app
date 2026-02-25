# Plan: Épica 3 — Transacciones (HU-06, HU-07, HU-08)

## Análisis del estado actual

Las Épicas 1 y 2 están completas. El modelo `Transaction` ya existe en `prisma/schema.prisma` con los campos base (`amount`, `type`, `description`, `date`, `accountId`). El campo `Account.balance` existe y está definido en BD, pero aún no se actualiza porque no hay transacciones reales.

Lo que falta:
- Modelo `TransactionTemplate` (no existe en el schema actual)
- API Routes para CRUD de transacciones y plantillas
- **Lógica crítica:** actualización atómica del `balance` de la caja al crear/editar/eliminar
- Página `/agregar` (referenciada en el BottomNav pero sin implementar)
- Historial real en `/cajas/[id]` (actualmente muestra estado vacío)
- Sección "Reciente" del Home con datos reales

**Decisiones técnicas validadas:**
- **Editar/eliminar transacciones:** incluido en esta épica
- **UI del formulario:** página completa en `/agregar`
- **Plantillas:** tabla en BD (`TransactionTemplate`) — persiste entre sesiones y dispositivos
- **Actualización de balance:** siempre atómica con `prisma.$transaction()` — esto es innegociable para la integridad de los datos

---

## Tareas

### Tarea 1 — Migración del schema: modelo `TransactionTemplate` ✅ HECHO

Agregar el modelo al `prisma/schema.prisma` y las relaciones correspondientes:

```prisma
model TransactionTemplate {
  id          String  @id @default(uuid())
  name        String  // Nombre amigable, ej: "Almuerzo diario"
  amount      Float
  type        String  // "INCOME" | "EXPENSE"
  description String
  accountId   String
  account     Account @relation(fields: [accountId], references: [id])
  userId      String
  user        User    @relation(fields: [userId], references: [id])
}
```

Agregar las relaciones inversas en `User` y `Account`:
```prisma
model User {
  // ... campos existentes ...
  templates TransactionTemplate[]
}

model Account {
  // ... campos existentes ...
  templates TransactionTemplate[]
}
```

Ejecutar:
```bash
npx prisma migrate dev --name add-transaction-template
```

---

### Tarea 2 — Lógica de balance atómica (helper compartido) ✅ HECHO

Crear `src/lib/balance.ts` con una función helper `applyTransactionToBalance`:

```ts
// Lógica centralizada para actualizar el balance de una caja
// Siempre debe ejecutarse dentro de un prisma.$transaction()

type Operation = "create" | "delete" | "update";

// Para "update", se necesita la transacción anterior para revertir su impacto
// antes de aplicar el nuevo
```

Esta función será la **única fuente de verdad** para las reglas:
- `INCOME`: `balance += amount`
- `EXPENSE`: `balance -= amount`
- En edición: revertir el impacto anterior → aplicar el nuevo

> **Regla de oro:** ninguna API Route modifica `Account.balance` directamente. Todas usan este helper dentro de `prisma.$transaction([...])`. Esto garantiza que si el insert de la transacción falla, el balance no se actualiza (y viceversa).

---

### Tarea 3 — API Route: crear y listar transacciones (`/api/transacciones`) ✅ HECHO

Crear `src/app/api/transacciones/route.ts`:

**`POST`** — Crea una transacción y actualiza el balance atómicamente:
1. Llama a `getAuthenticatedUserId()`
2. Body: `{ amount, type, description, date, accountId, saveAsTemplate?, templateName? }`
3. Verifica que la caja (`accountId`) pertenece al usuario
4. Ejecuta `prisma.$transaction([...])` con:
   - `prisma.transaction.create({ data: { amount, type, description, date, accountId } })`
   - `prisma.account.update({ where: { id: accountId }, data: { balance: { increment/decrement: amount } } })`
5. Si `saveAsTemplate === true`: crea también el `TransactionTemplate` dentro del mismo `.$transaction()`
6. Retorna `201` con la transacción creada

**`GET`** — Lista transacciones del usuario (para el Home):
- Parámetros de query opcionales: `?limit=20&skip=0`
- Query: transacciones de todas las cajas del usuario, ordenadas por `date DESC`
- Necesario para la sección "Reciente" del Home y futura paginación (Épica 5)

---

### Tarea 4 — API Route: detalle, edición y eliminación (`/api/transacciones/[id]`) ✅ HECHO

Crear `src/app/api/transacciones/[id]/route.ts`:

**`PUT`** — Edita una transacción y reconcilia el balance:
1. Verifica que la transacción existe y pertenece al usuario (via join con `Account.userId`)
2. Recupera la transacción anterior (`oldTx`)
3. Ejecuta `prisma.$transaction([...])` con:
   - Revertir impacto de `oldTx`: si era INCOME → decrement; si era EXPENSE → increment
   - Aplicar impacto del nuevo: según el nuevo `type` y `amount`
   - Actualizar la transacción con los nuevos valores
4. Si cambia de caja (`accountId` diferente): revertir en la caja anterior, aplicar en la nueva (ambas en el mismo `.$transaction()`)

**`DELETE`** — Elimina la transacción y revierte el balance:
1. Verifica pertenencia
2. `prisma.$transaction([...])`:
   - `prisma.transaction.delete({ where: { id } })`
   - Revertir impacto en `Account.balance` (operación inversa al `type` original)
3. Retorna `200`

---

### Tarea 5 — API Route: plantillas (`/api/plantillas`) ✅ HECHO

Crear `src/app/api/plantillas/route.ts`:

**`GET`** — Lista plantillas del usuario:
- `prisma.transactionTemplate.findMany({ where: { userId }, include: { account: true }, orderBy: { name: 'asc' } })`
- Retorna array con datos de la plantilla + nombre de la caja asociada

**`POST`** — Crea una plantilla (cuando se guarda por separado, no desde el form de transacción):
- Body: `{ name, amount, type, description, accountId }`
- Verifica pertenencia de la caja

Crear `src/app/api/plantillas/[id]/route.ts`:

**`DELETE`** — Elimina una plantilla:
- Verifica pertenencia por `userId`
- `prisma.transactionTemplate.delete({ where: { id } })`

---

### Tarea 6 — Componente: `TransaccionForm` ✅ HECHO

Crear `src/components/transacciones/TransaccionForm.tsx` (Client Component):

**Sección superior — Selector de tipo:**
- Toggle visual prominente "INGRESO / GASTO"
- Fondo verde (`bg-success/20`) cuando es INCOME, rojo (`bg-error/20`) cuando es EXPENSE
- Ocupa el ancho completo, prominente en móvil

**Campos del formulario:**
1. **Monto** — input numérico grande (`text-3xl`, `font-mono`), prominente, mínimo 0.01
2. **Descripción** — input texto, requerido
3. **Fecha** — input `date`, default = fecha de hoy (`new Date().toISOString().split("T")[0]`)
4. **Caja** — `<select>` con las cajas no archivadas del usuario (recibidas como prop)

**Sección de Favoritos (HU-07):**
- Botón "Usar Favorito" (ícono `Star` de lucide) que despliega un dropdown/modal
- Lista de plantillas disponibles: al seleccionar una, pre-llena todos los campos del formulario
- Si no hay plantillas: muestra "Aún no tienes favoritos"

**Sección de guardar como plantilla:**
- Checkbox "Guardar como favorito"
- Si está activo: aparece campo de texto "Nombre del favorito" (ej: "Almuerzo", "Arriendo")

**Props:**
```ts
interface TransaccionFormProps {
  cajas: Account[];
  plantillas: TransactionTemplate[];
  initialData?: Partial<Transaction>; // Para modo edición
  preselectedCajaId?: string;         // Para cuando se llega desde /cajas/[id]
  onSubmit: (data: TransaccionFormData) => Promise<void>;
  isLoading: boolean;
}
```

---

### Tarea 7 — Componente: `TransaccionItem` ✅ HECHO

Crear `src/components/transacciones/TransaccionItem.tsx`:

Fila del historial que muestra:
- Ícono de la caja (emoji) dentro de un círculo con el color de la caja
- Descripción (texto principal)
- Nombre de la caja + fecha formateada (texto secundario, `text-xs text-gray-500`)
- Monto con signo y color:
  - INCOME: `+$ 15.000` en `text-success`
  - EXPENSE: `-$ 15.000` en `text-error`
- Botón `MoreVertical` (lucide) con menú contextual: **Editar** / **Eliminar**

**El menú Eliminar** debe mostrar un diálogo de confirmación antes de proceder (DaisyUI `modal` o `confirm` nativo).

Props:
```ts
interface TransaccionItemProps {
  transaction: Transaction & { account: Pick<Account, "name" | "icon" | "color"> };
  onDelete: (id: string) => void;
}
```

---

### Tarea 8 — Página: Nueva Transacción (`/agregar`) ✅ HECHO

Crear `src/app/(app)/agregar/page.tsx`:
- Server Component — lee cajas y plantillas del usuario con Prisma directo
- Renderiza `TransaccionForm` como Client Component hijo
- Acepta query param `?cajaId=xxx` para preseleccionar la caja (viene del botón "+" del detalle de caja)
- Al submit (Client Component): `POST /api/transacciones`
- Si éxito: redirigir a `/cajas` o a `/cajas/[cajaId]` si había preselección

---

### Tarea 9 — Página: Editar Transacción (`/transacciones/[id]/editar`) ✅ HECHO

Crear `src/app/(app)/transacciones/[id]/editar/page.tsx`:
- Server Component — obtiene la transacción con Prisma, verifica pertenencia via join con Account
- Si no pertenece al usuario: redirigir a `/`
- Renderiza `TransaccionForm` con `initialData` precargado
- Al submit: `PUT /api/transacciones/[id]`
- Si éxito: redirigir a `/cajas/[accountId]`

---

### Tarea 10 — Actualizar `/cajas/[id]` con historial real (HU-08) ✅ HECHO

Actualizar `src/app/(app)/cajas/[id]/page.tsx`:
- Agregar query Prisma para obtener transacciones de la caja, ordenadas por `date DESC`:
  ```ts
  prisma.transaction.findMany({
    where: { accountId: id },
    orderBy: { date: "desc" },
    take: 50,
  })
  ```
- Renderizar lista de `TransaccionItem` en la sección "Movimientos"
- Si no hay transacciones: mantener estado vacío actual
- El saldo mostrado en la cabecera ahora es el `account.balance` real (ya calculado en épicas anteriores, ahora se vuelve real)

---

### Tarea 11 — Actualizar el Home con transacciones reales ✅ HECHO

Actualizar `src/app/(app)/page.tsx`:
- **Ingresos del mes:** suma de `amount` de transacciones tipo `INCOME` del mes en curso, de todas las cajas del usuario
- **Gastos del mes:** suma de `amount` de transacciones tipo `EXPENSE` del mes en curso
- **Sección "Reciente":** últimas 5 transacciones de todas las cajas (query con `take: 5`, `orderBy: { date: "desc" }`), renderizadas con `TransaccionItem` (sin botón de opciones en esta vista)
- Queries ejecutados en paralelo con `Promise.all([...])` para minimizar latencia

---

### Tarea 12 — Gestión de Favoritos desde la UI (`/perfil` o sección dedicada) ✅ HECHO

Crear `src/app/(app)/plantillas/page.tsx` (o integrar en `/perfil`):
- Lista de plantillas guardadas del usuario
- Cada ítem muestra: nombre, tipo (badge INGRESO/GASTO), monto, caja asociada
- Botón de eliminar por plantilla (con confirmación)
- Esta vista es secundaria — el acceso principal a favoritos es desde el formulario de transacción

> Si `/perfil` no existe aún, crear el shell mínimo con un link a la lista de plantillas.

---

## Criterios de verificación

1. Crear una transacción EXPENSE de $15.000 en la caja "Efectivo" → el saldo de "Efectivo" disminuye exactamente $15.000
2. Crear una transacción INCOME de $500.000 → el saldo de la caja aumenta $500.000
3. Editar una transacción cambiando el monto → el balance se reconcilia correctamente (sin doble descuento)
4. Editar una transacción cambiando de caja → ambas cajas reflejan el cambio correcto
5. Eliminar una transacción → el balance de la caja se revierte al valor anterior
6. Guardar como plantilla → aparece en el dropdown "Usar Favorito" del formulario
7. Cargar una plantilla → pre-llena todos los campos del formulario correctamente
8. Abrir `/agregar?cajaId=xxx` → la caja correspondiente está preseleccionada
9. Historial en `/cajas/[id]` muestra transacciones ordenadas por fecha DESC con diferenciación visual ingreso/gasto
10. Sección "Reciente" del Home muestra las últimas 5 transacciones reales
11. Ingresos/Gastos del mes en el Home reflejan los totales reales del mes actual
12. `DELETE /api/transacciones/[id]` sin sesión válida → `401`
13. `npm run build` completa sin errores de TypeScript

---

## Decisiones técnicas registradas

| Decisión | Elección | Justificación |
|---|---|---|
| Actualización de balance | `prisma.$transaction()` atómica | Garantiza consistencia: si la transacción falla, el balance no se corrompe |
| Helper de balance | `src/lib/balance.ts` centralizado | Una sola fuente de verdad para las reglas INCOME/EXPENSE; fácil de testear y mantener |
| Editar/Eliminar | Incluido en esta épica | Evitar datos corruptos: si el usuario se equivoca en el monto no debe crear una transacción de corrección manual |
| UI del formulario | Página completa `/agregar` | Ya referenciada en `BottomNav`; más espacio en móvil para el teclado numérico |
| Plantillas | Tabla en BD (`TransactionTemplate`) | Persiste entre dispositivos; alineado con el enfoque serverful del proyecto |
| `preselectedCajaId` | Query param `?cajaId=xxx` | Permite navegar desde el detalle de caja al formulario con contexto, sin prop drilling |
| Historial en `/cajas/[id]` | `take: 50`, sin paginación aún | Suficiente para uso personal; la paginación global se implementa en Épica 5 (HU-11) |
| Ingresos/Gastos del mes | Filtro por mes en curso en Prisma | Más eficiente que traer todas las transacciones y filtrar en cliente |
