# Plan Épica 5 — Dashboard Principal (Balance Líquido e Historial Global)

## Análisis del estado actual

El Home (`src/app/(app)/page.tsx`) ya existe con estructura funcional, pero incompleto según los requerimientos de HU-11:

**Problemas detectados:**

1. **Balance incorrecto:** `totalBalance` suma el saldo de TODAS las cuentas sin filtrar por `isThirdParty` ni `isGoal`. Debe ser solo "dinero líquido propio".
2. **Historial limitado y estático:** Solo muestra las últimas 5 transacciones (`take: 5`) sin paginación ni "Cargar más".
3. **Falta de caja de origen en el listado:** La sección "Reciente" del Home no muestra de qué caja proviene cada transacción.

**Lo que ya funciona y se reutiliza:**

- `TransaccionItem` acepta `transaction` con `account: { name, icon, color }` incluido (por el `include` en la query).
- `/api/transacciones` ya soporta `?skip=N&limit=N` con paginación offset-based.
- `formatBalance`, `Card`, `getAuthenticatedUserId`, `authOptions` — todos disponibles.

---

## Decisiones técnicas registradas

| Decisión | Elección |
|---|---|
| Paginación del historial global | Offset-based (`skip = page * 20`) |
| Balance líquido $0 (sin cajas propias/líquidas) | Muestra `$0` sin texto adicional |
| Caja de origen en cada transacción del Home | Sí, nombre de la caja bajo la descripción en texto pequeño |

---

## Tareas

### Tarea 1: Corregir el cálculo del Balance Líquido en `page.tsx`

**Archivo:** `src/app/(app)/page.tsx`

Modificar la query de `accounts` para filtrar únicamente las cajas que son:
- `isThirdParty: false` (cajas propias)
- `isGoal: false` (cajas corrientes/efectivo, no metas)
- `isArchived: false` (ya existente)

```ts
// Antes
prisma.account.findMany({
  where: { userId, isArchived: false },
  select: { balance: true },
}),

// Después
prisma.account.findMany({
  where: { userId, isArchived: false, isThirdParty: false, isGoal: false },
  select: { balance: true },
}),
```

El label de la tarjeta cambia de "Saldo Total" a "Balance Líquido" para reflejar la semántica correcta.

---

### Tarea 2: Crear el componente cliente `HistorialGlobal`

**Archivo nuevo:** `src/components/home/HistorialGlobal.tsx`

Componente Client que gestiona el estado de la lista de transacciones con paginación offset-based.

**Responsabilidades:**
- Recibe `transaccionesIniciales: TransaccionConCaja[]` (las primeras 20 del Server Component).
- Recibe `totalCount: number` para saber si hay más páginas.
- Mantiene estado `items` (array acumulado) y `skip` (offset actual).
- Al presionar "Cargar más": hace `fetch(/api/transacciones?skip={skip}&limit=20)`, obtiene el JSON, lo concatena al estado `items`, incrementa `skip += 20`.
- Oculta el botón "Cargar más" cuando `items.length >= totalCount`.
- Muestra `TransaccionItem` con `showOptions={false}` para cada item.
- Muestra el nombre de la caja de origen debajo de la descripción de cada item (ver Tarea 3).

**Estructura de tipos:**
```ts
type TransaccionConCaja = Transaction & {
  account: Pick<Account, "name" | "icon" | "color">;
};
```

**Estado vacío:** igual al actual — emoji 📭 con texto "Aun no hay transacciones recientes."

**Estado del botón "Cargar más":** debe tener `isLoading` local con spinner DaisyUI (`loading loading-spinner loading-xs`) mientras se hace el fetch.

---

### Tarea 3: Mostrar el nombre de la caja en `TransaccionItem`

**Archivo:** `src/components/transacciones/TransaccionItem.tsx`

Verificar si el componente ya renderiza `transaction.account.name`. Si no lo hace (o lo omite en el layout del Home), agregar una línea secundaria con el nombre de la caja.

Patrón de referencia (ya usado en `PlantillasClient`):
```tsx
<p className="text-xs text-base-content/50 truncate">
  {transaction.description} · {transaction.account.name}
</p>
```

Si `TransaccionItem` tiene un prop condicional `showAccountName` o similar, agregar esa opción. Si no, renderizarlo siempre (es información útil tanto en el Home como en el detalle de caja donde ya se filtra por cuenta).

---

### Tarea 4: Actualizar `page.tsx` (Home) para usar `HistorialGlobal`

**Archivo:** `src/app/(app)/page.tsx`

**Cambios en la query de `recientes`:**
- Cambiar `take: 5` → `take: 20`
- Agregar consulta paralela del total count para saber si hay más páginas:

```ts
const [accounts, ingresosMes, gastosMes, recientes, totalTransacciones] = await Promise.all([
  // ... queries existentes con el filtro de balance líquido
  prisma.transaction.findMany({
    where: { account: { userId } },
    include: { account: { select: { name: true, icon: true, color: true } } },
    orderBy: { date: "desc" },
    take: 20,
  }),
  prisma.transaction.count({
    where: { account: { userId } },
  }),
]);
```

**Sección "Reciente" → reemplazar** por `<HistorialGlobal>`:

```tsx
// Antes
<div className="divide-y divide-base-300">
  {recientes.map((t) => (
    <TransaccionItem key={t.id} transaction={t} showOptions={false} />
  ))}
</div>

// Después
<HistorialGlobal
  transaccionesIniciales={recientes}
  totalCount={totalTransacciones}
/>
```

**Encabezado de la sección:** cambiar "Reciente" → "Movimientos" y el link de "Ver cajas" mantenerlo.

---

### Tarea 5: Actualizar el label de la tarjeta principal

**Archivo:** `src/app/(app)/page.tsx`

Cambiar el texto de la tarjeta de balance:
```tsx
// Antes
<p className="text-sm text-gray-400 font-medium">Saldo Total</p>

// Después
<p className="text-sm text-gray-400 font-medium">Balance Líquido</p>
```

---

### Tarea 6 (opcional, mejora de UX): Agregar subtítulo aclaratorio en la tarjeta

Debajo del monto, agregar un texto explicativo diminuto que aclare qué incluye el balance:

```tsx
<p className="text-xs text-base-content/30 mt-1">Solo cajas propias y corrientes</p>
```

Esto si con la Tarea 1 el número cambia radicalmente respecto al saldo que el usuario veía antes.

---

## Archivos a crear

| Archivo | Descripción |
|---|---|
| `src/components/home/HistorialGlobal.tsx` | Client Component con estado de paginación offset-based |

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/app/(app)/page.tsx` | Filtrar balance líquido, cargar 20 transacciones + count, usar `HistorialGlobal` |
| `src/components/transacciones/TransaccionItem.tsx` | Verificar/agregar nombre de caja de origen |

---

## Criterios de verificación

1. La tarjeta "Balance Líquido" muestra solo la suma de cajas donde `isThirdParty: false` Y `isGoal: false` Y `isArchived: false`.
2. Si el usuario tiene solo cajas de terceros o metas, el balance muestra `$0` (sin mensaje adicional).
3. La sección "Movimientos" en el Home carga las últimas 20 transacciones al entrar, incluyendo transacciones de cualquier tipo de caja (propia, terceros, metas).
4. Cada fila en el historial muestra: icono/color de la caja, descripción, nombre de la caja (texto pequeño), monto (coloreado) y fecha.
5. El botón "Cargar más" aparece solo si hay más de 20 transacciones en total.
6. Al presionar "Cargar más", se anexan al final las siguientes 20 transacciones sin reemplazar las anteriores.
7. Cuando se han cargado todas las transacciones (`items.length >= totalCount`), el botón "Cargar más" desaparece.
8. Durante el fetch de "Cargar más", el botón muestra un spinner y queda deshabilitado.
9. Los totales de Ingresos/Gastos del mes (en la tarjeta) continúan calculándose desde TODAS las cuentas del usuario (no solo las líquidas) para reflejar la actividad real del mes.
