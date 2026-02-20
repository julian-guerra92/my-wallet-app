"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CajaForm } from "@/components/cajas/CajaForm";
import type { Account, CreateCajaBody } from "@/types";

interface EditCajaClientProps {
  caja: Account;
}

export function EditCajaClient({ caja }: EditCajaClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: CreateCajaBody) {
    setIsLoading(true);
    setError(null);

    const res = await fetch(`/api/cajas/${caja.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/cajas");
    } else {
      const body = await res.json();
      setError(body.error ?? "Error al guardar los cambios.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link href="/cajas" className="btn btn-ghost btn-sm btn-circle">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Editar Caja</h1>
      </header>

      {error && (
        <div className="alert alert-error text-sm py-2 px-4">{error}</div>
      )}

      <CajaForm initialData={caja} onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
