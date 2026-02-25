"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TransaccionForm } from "@/components/transacciones/TransaccionForm";
import type { Account, Transaction, TransactionTemplate, TransaccionFormData } from "@/types";

interface EditarTransaccionClientProps {
  transaction: Transaction;
  cajas: Account[];
  plantillas: TransactionTemplate[];
}

export function EditarTransaccionClient({
  transaction,
  cajas,
  plantillas,
}: EditarTransaccionClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: TransaccionFormData) {
    setIsLoading(true);
    setError(null);

    const res = await fetch(`/api/transacciones/${transaction.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push(`/cajas/${transaction.accountId}`);
    } else {
      const body = await res.json();
      setError(body.error ?? "Error al guardar los cambios.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link href={`/cajas/${transaction.accountId}`} className="btn btn-ghost btn-sm btn-circle">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Editar Transaccion</h1>
      </header>

      {error && (
        <div className="alert alert-error text-sm py-2 px-4">{error}</div>
      )}

      <TransaccionForm
        cajas={cajas}
        plantillas={plantillas}
        initialData={transaction}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
