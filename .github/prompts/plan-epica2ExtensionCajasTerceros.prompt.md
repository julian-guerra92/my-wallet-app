# Plan: Épica 2 Extensión — Cajas de Terceros (HU-10)

## Análisis del estado actual

La Épica 2 está completa: modelo `Account` migrado, API Routes en `/api/cajas` y `/api/cajas/[id]`, componentes `CajaForm`, `CajaCard`, `ColorPicker`, y páginas `/cajas`, `/cajas/nueva`, `/cajas/[id]/editar`, `/cajas/[id]`.

Esta extensión agrega un único concepto nuevo — la clasificación de una caja como **"Propia"** o **"Tercero"** — propagado a través de todas las capas ya existentes.

**Decisiones técnicas:**
- **Campo en BD:** `Boolean isThirdParty @default(false)` en `Account`
- **Indicador visual:** badge de texto "Tercero" en `CajaCard`
- **Saldo Total del Home:** sin cambios — se ajustará en la Épica 5 (HU-11)

---

## Tareas

### Tarea 1 — Migración del schema: campo `isThirdParty` ✅ Hecho

Agregar un campo al modelo `Account` en `prisma/schema.prisma`:

```prisma
model Account {
  // ... campos existentes ...
  isThirdParty Boolean @default(false)
}
```

Ejecutar:
```bash
npx prisma migrate dev --name add-account-third-party
```

> Todos los registros existentes tendrán `isThirdParty: false` por defecto — sin impacto en los datos actuales.

---

### Tarea 2 — Actualizar API Routes para aceptar `isThirdParty` ✅ Hecho

**`POST /api/cajas`** (`src/app/api/cajas/route.ts`):
- Leer `isThirdParty` del body (boolean, default `false` si no se envía)
- Incluir `isThirdParty` en el `prisma.account.create({ data: { ..., isThirdParty } })`

**`PUT /api/cajas/[id]`** (`src/app/api/cajas/[id]/route.ts`):
- Aceptar `isThirdParty` como campo editable en el body
- Incluirlo en el `prisma.account.update({ data: { ..., isThirdParty } })`

> No se requieren cambios en `GET` ni en `DELETE`. El campo se retorna automáticamente en las lecturas.

---

### Tarea 3 — Actualizar `CajaForm` con el toggle de tercero ✅ Hecho

Actualizar `src/components/cajas/CajaForm.tsx`:
- Agregar un toggle DaisyUI con label **"¿Dinero de un tercero?"** debajo del toggle de "Es Meta de Ahorro"
- Estado local: `isThirdParty: boolean`, inicializado desde `initialData?.isThirdParty ?? false`
- Incluir `isThirdParty` en el objeto enviado a `onSubmit`
- Descripción de ayuda bajo el toggle (texto pequeño): *"Activa esto si administras fondos de otra persona. No afectará tu saldo personal."*

> El toggle de tercero es **independiente** del toggle de Meta de Ahorro — ambos pueden estar activos o inactivos en cualquier combinación.

---

### Tarea 4 — Actualizar `CajaCard` con el badge "Tercero" ✅ Hecho

Actualizar `src/components/cajas/CajaCard.tsx`:
- Agregar la prop `isThirdParty: boolean` al tipo de datos recibido
- Si `isThirdParty === true`, mostrar un badge DaisyUI junto al nombre de la caja:
  - Clase: `badge badge-accent badge-outline badge-xs`
  - Texto: `"Tercero"`
  - Color accent (`#f471b5`) — diferencia del badge "Meta" que usa secondary
- Posición: inline junto al nombre, a la derecha del texto, en la misma fila
- Si ambos `isGoal` e `isThirdParty` son `true`, ambos badges se muestran en la misma fila

---

### Tarea 5 — Actualizar la página `/cajas` con sección separada ✅ Hecho

Actualizar `src/app/(app)/cajas/page.tsx`:
- Separar las cajas en tres grupos para el renderizado:
  1. **Propias** — `isThirdParty: false` e `isGoal: false`
  2. **Metas** — `isGoal: true` (pueden ser propias o de tercero)
  3. **Terceros** — `isThirdParty: true` e `isGoal: false`
- Mostrar cada grupo bajo su propio encabezado de sección (mismo patrón visual que usa la sección "Metas" actual)
- Si el grupo "Terceros" está vacío, no se renderiza la sección ni el encabezado
- Orden dentro de cada grupo: alfabético por nombre (ya garantizado por el query actual)

---

### Tarea 6 — Actualizar la página de detalle `/cajas/[id]` ✅ Hecho

Actualizar `src/app/(app)/cajas/[id]/page.tsx`:
- Si la caja es de tercero (`isThirdParty === true`), mostrar un banner informativo en la parte superior del detalle:

```
Banner estilo DaisyUI alert con variant "info":
"Este bolsillo administra fondos de un tercero. Los movimientos no afectan tu saldo personal."
```

- El funcionamiento interno (historial, botón agregar movimiento) permanece idéntico al de las cajas propias

---

## Criterios de verificación

1. Crear una caja marcada como "Tercero" → aparece en `/cajas` bajo la sección "Terceros" con badge "Tercero" visible
2. Crear una caja con ambos toggles activos (Meta + Tercero) → aparece en la sección "Metas" con ambos badges
3. Editar una caja propia existente → activar el toggle de tercero → se mueve a la sección correcta
4. El detalle de una caja de tercero muestra el banner informativo
5. El Home **no** cambia el cálculo del Saldo Total (diferido a Épica 5)
6. `POST /api/cajas` con `isThirdParty: true` → crea la caja con el campo correcto en BD
7. `PUT /api/cajas/[id]` cambiando `isThirdParty` → se refleja en el listado inmediatamente
8. `npm run build` completa sin errores de TypeScript

---

## Decisiones técnicas registradas

| Decisión | Elección | Justificación |
|---|---|---|
| Campo en BD | `Boolean isThirdParty @default(false)` | Simple, sin overhead de enum; suficiente para los casos de uso actuales |
| Indicador visual | Badge "Tercero" (texto) en `CajaCard` | Legible y no ambiguo; consistente con el badge "Meta" ya existente |
| Color del badge | Accent (`#f471b5`) | Diferencia visualmente del badge "Meta" (secondary) y del color primary de acciones |
| Sección separada en `/cajas` | Sí — tercer grupo "Terceros" | Evita mezclar contextos financieros en el listado; facilita la auditoría visual |
| Impacto en Home | Ninguno (diferido a Épica 5) | HU-11 requiere más reglas de negocio (excluir también las metas); mejor hacerlo todo junto |
| Compatibilidad con `isGoal` | Ambos campos independientes | Una caja puede ser "Meta de ahorro de un tercero" (caso de uso válido: ahorrar para alguien más) |
