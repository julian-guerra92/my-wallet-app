"use client";

import { useState } from "react";
import { TransaccionItem } from "@/components/transacciones/TransaccionItem";
import type { Transaction, Account } from "@/types";

type TransaccionConCaja = Transaction & { account: Pick<Account, "name" | "icon" | "color"> };

interface CajaTransaccionesProps {
  transacciones: TransaccionConCaja[];
}

export function CajaTransacciones({ transacciones: initial }: CajaTransaccionesProps) {
  const [transacciones, setTransacciones] = useState(initial);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/transacciones/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTransacciones((prev) => prev.filter((t) => t.id !== id));
    }
  }

  if (transacciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <span className="text-4xl">📭</span>
        <p className="text-base-content/50 text-sm">Aun no hay transacciones.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-base-300">
      {transacciones.map((t) => (
        <TransaccionItem key={t.id} transaction={t} onDelete={handleDelete} />
      ))}
    </div>
  );
}
