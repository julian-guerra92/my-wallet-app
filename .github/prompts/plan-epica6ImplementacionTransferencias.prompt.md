## Plan: Implementación de Transferencias (Épica 6)

La implementación de transferencias entre cajas requiere crear dos registros en la base de datos (un descuento en la cuenta de origen y un abono en la cuenta de destino), enlazarlos mediante un identificador y actualizar el balance de ambas cuentas de manera atómica (Asegurando la integridad gracias a Prisma transactions).

**Steps**
1. **Modelado de Datos (Prisma)**: Modify `schema.prisma` to support transfers adding `isTransfer Boolean @default(false)`, `linkedAccountId String?`, and `groupId String?` to the `Transaction` model. Generate migration.
2. **Actualización de Tipos**: Update `src/types/transaction.ts` to allow `type: "INCOME" | "EXPENSE" | "TRANSFER"`, and configure `TransaccionFormData` to accept an optional `destinationAccountId`.
3. **API (Creación)**: Modify `src/app/api/transacciones/route.ts` intercepting `type === "TRANSFER"`. Generate a UUID for `groupId`, create the `EXPENSE` transaction on the source account, the `INCOME` transaction on the destination account, and apply the corresponding balances, all wrapped in a `prisma.$transaction`.
4. **API (Edición y Eliminación)**: Modify `src/app/api/transacciones/[id]/route.ts`. If the target transaction has a `groupId`, `DELETE` operations must eliminate **both** linked transactions and revert balances for both. `PUT` operations must similarly update both accounts and their applied balances correctly.
5. **Formulario UI**: Update `src/components/transacciones/TransaccionForm.tsx`. Add "TRANSFERENCIA" as a tercer toggle option. When selected, show "Caja Destino" alongside the regular "Caja" (Origen). Add validation so origin isn't the same as destination, and hide the "Favoritos/Plantilla" feature for transfers.
6. *depends on 5.* **Historial (Visualización UI)**: Update `src/components/transacciones/TransaccionItem.tsx`. Display a distinct icon (e.g., `ArrowRightLeft`) and customize the text (e.g., *Transferencia hacia [Caja]* o *desde [Caja]*) when `isTransfer === true`.

**Relevant files**
- `prisma/schema.prisma` — Database schema definition.
- `src/types/transaction.ts` — TypeScript interfaces constraint.
- `src/app/api/transacciones/route.ts` — POST endpoint handler.
- `src/app/api/transacciones/[id]/route.ts` — PUT/DELETE endpoint handler.
- `src/components/transacciones/TransaccionForm.tsx` — Main creation and editing form.
- `src/components/transacciones/TransaccionItem.tsx` — Render component for list items.

**Verification**
1. Test regular income and expenses to rule out regressions.
2. Submit a $500 transfer from Caja A to Caja B: Both account balances must visually and mathematically reflect the change correctly.
3. Verify that removing one side of the transfer via the UI cleanly removes both sides from the DB and accurately restores both account balances.

**Decisions**
- For maximum simplicity, we reuse the existing `INCOME` and `EXPENSE` logic under the hood inside `route.ts`. The UI `type = "TRANSFER"` is just a facade for creating two intrinsically linked IN/OUT transactions. This ensures minimal touch to existing `balance.ts` logic.
- "Guardar como plantilla" functionality will be hidden for transfers initially to limit complexity.

**Further Considerations**
1. ¿A nivel de experiencia de usuario, te gustaría permitir editar la Caja Origen y Destino de una transferencia posteriormente, o crees que es preferible deshabilitar su edición y obligar al usuario a eliminar y crear una nueva ante equivocaciones (esto simplifica en gran medida el código a costa de algo de flexibilidad)?