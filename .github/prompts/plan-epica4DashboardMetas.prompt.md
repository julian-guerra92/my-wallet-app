# Plan: Épica 4 — Dashboard de Metas con Semáforo (HU-09)

## Análisis del estado actual

Las Épicas 1, 2 y 3 están completas. Los datos necesarios para esta épica ya existen:
- `Account.isGoal`, `Account.targetAmount`, `Account.balance` — en BD y disponibles
- `Account.isThirdParty` — para identificar metas de terceros (se muestran mezcladas)
- `Transaction` — historial necesario para calcular la fecha estimada de cumplimiento
- `CajaCard` — ya incluye la barra de progreso semáforo básica (implementada en Épica 2)
- La ruta `/metas` está en el `BottomNav` pero su página aún no existe

**Lo que falta en esta épica:**
- Página `/metas` dedicada con vista enriquecida
- Componente `MetaCard` expandido (barra, porcentaje, monto faltante, fecha estimada)
- Lógica de cálculo de fecha estimada basada en ritmo de ahorro histórico
- Helper de proyección reutilizable
- Resumen agregado al tope de la página: cuántas metas activas, cuántas en verde

**Decisiones técnicas:**
- **Metas visibles:** todas (propias + terceros) en una sola lista, sin separación de secciones
- **Detalle de card:** barra de progreso + porcentaje + monto faltante + fecha estimada
- **Sin paginación:** para uso personal el número de metas será pequeño, listado completo
- **Fecha estimada:** calculada en el servidor a partir del ritmo de ingresos netos históricos de la caja
- **Sin API Route propia:** Prisma directo en Server Component, consistente con el patrón del resto del proyecto

---

## Tareas

### Tarea 1 — Helper de proyección de metas (`src/lib/meta-projection.ts`)

Crear `src/lib/meta-projection.ts` con la función `calcularFechaEstimada`:

**Algoritmo:**
1. Recibir el historial de transacciones de la caja y el monto faltante (`targetAmount - balance`)
2. Si no hay transacciones → retornar `null` → display `"Sin actividad aún"`
3. Calcular el rango de fechas: desde la transacción más antigua hasta hoy
4. Si el rango es menor a 7 días → retornar `null` (insuficiente historial)
5. Calcular el **flujo neto mensual**:
   - `totalIncome` = suma de todos los INCOME
   - `totalExpense` = suma de todos los EXPENSE
   - `netFlow = totalIncome - totalExpense`
   - `mesesTranscurridos` = días entre primera tx y hoy / 30.44
   - `ritmoMensualNeto = netFlow / mesesTranscurridos`
6. Si `ritmoMensualNeto <= 0` → retornar `null` → display `"Meta en retroceso"`
7. `mesesRestantes = montoFaltante / ritmoMensualNeto`
8. `fechaEstimada = hoy + mesesRestantes meses`
9. Retornar la fecha estimada como `Date`

**Casos de display para el componente:**
| Resultado | Texto mostrado |
|---|---|
| Sin transacciones | `"Sin actividad aún"` |
| Rango < 7 días | `"Sin actividad aún"` |
| Flujo neto ≤ 0 | `"Meta en retroceso"` |
| `balance >= targetAmount` | `"¡Meta cumplida! 🎉"` |
| Fecha calculada | `"Estimado: ago 2026"` (formato `mes año`) |

---

### Tarea 2 — Helper compartido (`src/lib/meta-utils.ts`)

Extraer `getProgressColor(percentage: number): string` del código existente en `CajaCard` hacia `src/lib/meta-utils.ts`:

```ts
export function getProgressColor(percentage: number): string {
  if (percentage < 50) return "progress-error";
  if (percentage < 80) return "progress-warning";
  return "progress-success";
}

export function getProgressTextColor(percentage: number): string {
  if (percentage < 50) return "text-error";
  if (percentage < 80) return "text-warning";
  return "text-success";
}
```

Actualizar `CajaCard` para importar `getProgressColor` desde aquí en lugar de definirla inline (DRY). `MetaCard` también la usará.

---

### Tarea 3 — Componente: `MetaCard`

Crear `src/components/metas/MetaCard.tsx`:

Card expandida para cada meta con mayor densidad de información que `CajaCard`.

**Layout vertical (ancho completo):**

```
┌─────────────────────────────────────────┐
│  [emoji] [dot color]  Nombre de la Meta │
│                        [badge Tercero?] │
├─────────────────────────────────────────┤
│  72%                                    │
│  ████████████░░░░░░  [barra semáforo]   │
├─────────────────────────────────────────┤
│  Saldo actual         Monto objetivo    │
│  $ 360.000            $ 500.000         │
│                                         │
│  Falta: $ 140.000                       │
│  Estimado: ago 2026                     │
└─────────────────────────────────────────┘
```

- La barra usa `getProgressColor` desde `src/lib/meta-utils.ts`
- El porcentaje y el texto de fecha/estado usan `getProgressTextColor`
- Si `balance >= targetAmount`: ocultar "Falta" y "Estimado", mostrar `"¡Meta cumplida! 🎉"` con icono `Trophy` (lucide)
- El monto faltante es siempre `Math.max(0, targetAmount - balance)`
- Clickeable → navega a `/cajas/[id]`
- Badge "Tercero" (`badge-accent badge-outline badge-xs`) si `isThirdParty === true`

**Props:**
```ts
interface MetaCardProps {
  account: Account & {
    transactions: Transaction[];
  };
}
```

La fecha estimada se calcula dentro del componente llamando a `calcularFechaEstimada(transactions, montoFaltante)`.

---

### Tarea 4 — Componente: `ResumenMetas`

Crear `src/components/metas/ResumenMetas.tsx`:

Banner de métricas en la parte superior de `/metas`. Tres stats en fila horizontal usando DaisyUI `stat` compacto (sin card, fondo transparente):

| Stat | Valor |
|---|---|
| **Metas activas** | Total de cajas con `isGoal: true` |
| **En verde** | Cantidad con progreso `≥ 80%` |
| **Total acumulado** | Suma de todos los `balance` de las metas |

**Props:**
```ts
interface ResumenMetasProps {
  metas: Array<{ balance: number; targetAmount: number }>;
}
```

El cálculo de las métricas se hace en el componente a partir de los datos recibidos.

---

### Tarea 5 — Página: Dashboard de Metas (`/metas`)

Crear `src/app/(app)/metas/page.tsx`:

- **Server Component** — query directa con Prisma (sin API Route intermedia)
- Obtener `userId` con `getAuthenticatedUserId()`
- Query:
  ```ts
  prisma.account.findMany({
    where: { userId, isGoal: true, isArchived: false },
    include: {
      transactions: {
        orderBy: { date: "asc" },
      },
    },
  })
  ```
- **Ordenamiento en JS** antes de renderizar: por `balance / targetAmount` descendente
  - Mayor progreso arriba (motivador — las más cerca de cumplirse primero)
  - Metas cumplidas al final (celebración)

**Estructura de la página:**
```
Encabezado: "Mis Metas"
─────────────────────────────
[ResumenMetas] — chips de métricas
─────────────────────────────
[MetaCard] caja 1 (mayor progreso)
[MetaCard] caja 2
[MetaCard] caja 3
...
[MetaCard] caja N (cumplida, al final)
```

**Estado vacío** (sin metas): mensaje + botón "Crear una meta" que enlaza a `/cajas/nueva` (el formulario ya tiene el toggle de Meta de Ahorro activado por defecto cuando se llega con `?preset=goal`).

---

### Tarea 6 — Refactor: eliminar duplicación en `CajaCard`

Actualizar `src/components/cajas/CajaCard.tsx`:
- Importar `getProgressColor` desde `src/lib/meta-utils.ts`
- Eliminar la definición inline de la misma lógica
- Sin cambios funcionales visibles — solo limpieza interna

---

## Criterios de verificación

1. Con metas existentes, `/metas` muestra todas (propias + terceros) sin filtrar
2. Porcentaje calculado correctamente: `(balance / targetAmount) * 100`, clampeado a 100%
3. Barra roja `< 50%`, amarilla `50–79%`, verde `≥ 80%`
4. **Fecha estimada — flujo positivo:** historial de ingresos regulares → muestra `"Estimado: mes año"`
5. **Fecha estimada — sin historial:** caja sin transacciones → muestra `"Sin actividad aún"`
6. **Fecha estimada — flujo negativo:** más gastos que ingresos → muestra `"Meta en retroceso"`
7. **Meta cumplida:** `balance >= targetAmount` → muestra `"¡Meta cumplida! 🎉"`, aparece al final del listado
8. Monto faltante siempre ≥ $0 (nunca negativo aunque el saldo supere el objetivo)
9. `ResumenMetas` muestra los conteos correctos reflejando el estado real de la BD
10. Sin metas → estado vacío con CTA funcional que lleva a `/cajas/nueva`
11. Click en `MetaCard` → navega a `/cajas/[id]` correctamente
12. `CajaCard` sigue funcionando igual tras el refactor (regresión cero)
13. `npm run build` completa sin errores de TypeScript

---

## Decisiones técnicas registradas

| Decisión | Elección | Justificación |
|---|---|---|
| Metas visibles | Todas (propias + terceros) sin separación | El usuario quiere ver el progreso global en un vistazo |
| Ordenamiento | Mayor progreso primero; cumplidas al final | Motivador y celebratorio a la vez |
| Fecha estimada | Flujo neto mensual histórico (`ΣIncome - ΣExpense`) | Más realista que solo sumar ingresos; refleja el saldo real acumulado |
| Cálculo de fecha | Server-side dentro del componente | Los datos vienen del Server Component padre; sin costo extra de red |
| `MetaCard` separado de `CajaCard` | Componente dedicado | Diferente densidad y propósito; evita prop drilling complejo en `CajaCard` |
| `getProgressColor` extraído | `src/lib/meta-utils.ts` | DRY — única fuente de verdad para la lógica de semáforo usada en dos componentes |
| Sin paginación | Listado completo | Uso personal: número de metas siempre pequeño (< 20) |
| Sin API Route | Prisma directo en Server Component | Consistente con el patrón de lectura del resto del proyecto |
