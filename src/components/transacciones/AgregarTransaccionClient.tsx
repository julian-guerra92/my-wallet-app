"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TransaccionForm } from "@/components/transacciones/TransaccionForm";
import type { Account, TransactionTemplate, TransaccionFormData } from "@/types";

interface AgregarTransaccionClientProps {
  cajas: Account[];
  plantillas: TransactionTemplate[];
  preselectedCajaId?: string;
}

export function AgregarTransaccionClient({
  cajas,
  plantillas,
  preselectedCajaId,
}: AgregarTransaccionClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: TransaccionFormData) {
    setIsLoading(true);
    setError(null);

    const res = await fetch("/api/transacciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const destino = preselectedCajaId ? `/cajas/${preselectedCajaId}` : "/cajas";
      router.push(destino);
    } else {
      const body = await res.json();
      setError(body.error ?? "Error al guardar la transaccion.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link href={preselectedCajaId ? `/cajas/${preselectedCajaId}` : "/cajas"} className="btn btn-ghost btn-sm btn-circle">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Nueva Transaccion</h1>
      </header>

      {error && (
        <div className="alert alert-error text-sm py-2 px-4">{error}</div>
      )}

      <TransaccionForm
        cajas={cajas}
        plantillas={plantillas}
        preselectedCajaId={preselectedCajaId}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
