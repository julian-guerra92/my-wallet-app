"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { CajaCard } from "@/components/cajas/CajaCard";
import type { Account } from "@/types";

interface CajaListProps {
  cajas: Account[];
  metas: Account[];
}

export function CajaList({ cajas, metas }: CajaListProps) {
  const router = useRouter();

  async function handleArchive(id: string) {
    await fetch(`/api/cajas/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const empty = cajas.length === 0 && metas.length === 0;

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <span className="text-5xl">🗂️</span>
        <p className="text-base-content/60 text-sm">Aún no tienes cajas creadas.</p>
        <Link href="/cajas/nueva" className="btn btn-primary btn-sm">
          Crear primera caja
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {cajas.length > 0 && (
        <section className="flex flex-col gap-3">
          {cajas.map((caja) => (
            <CajaCard key={caja.id} caja={caja} onArchive={handleArchive} />
          ))}
        </section>
      )}

      {metas.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
            Metas de Ahorro
          </h2>
          {metas.map((meta) => (
            <CajaCard key={meta.id} caja={meta} onArchive={handleArchive} />
          ))}
        </section>
      )}
    </div>
  );
}
