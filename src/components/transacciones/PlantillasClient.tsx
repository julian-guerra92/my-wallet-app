"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { TransactionTemplate } from "@/types";

interface PlantillasClientProps {
  plantillas: TransactionTemplate[];
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("es-CO");
}

export function PlantillasClient({ plantillas: initial }: PlantillasClientProps) {
  const [plantillas, setPlantillas] = useState(initial);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/plantillas/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPlantillas((prev) => prev.filter((p) => p.id !== id));
    }
    setConfirmId(null);
  }

  if (plantillas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="text-4xl">⭐</span>
        <p className="text-base-content/50 text-sm">
          Aun no tienes favoritos guardados.<br />
          Cuando crees una transaccion, puedes marcarla como favorito.
        </p>
      </div>
    );
  }

  const plantillaEnConfirm = plantillas.find((p) => p.id === confirmId);

  return (
    <>
      <div className="flex flex-col divide-y divide-base-300">
        {plantillas.map((p) => (
          <div key={p.id} className="flex items-center gap-3 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">{p.name}</p>
                <span
                  className={`badge badge-xs ${
                    p.type === "INCOME" ? "badge-success" : "badge-error"
                  }`}
                >
                  {p.type === "INCOME" ? "INGRESO" : "GASTO"}
                </span>
              </div>
              <p className="text-xs text-base-content/50 truncate">
                {p.description} · {p.account?.name ?? ""}
              </p>
            </div>
            <span
              className={`text-sm font-semibold shrink-0 ${
                p.type === "INCOME" ? "text-success" : "text-error"
              }`}
            >
              ${formatAmount(p.amount)}
            </span>
            <button
              type="button"
              onClick={() => setConfirmId(p.id)}
              className="btn btn-ghost btn-xs px-1 text-error"
              aria-label="Eliminar plantilla"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {plantillaEnConfirm && (
        <ConfirmModal
          id="confirm-delete-plantilla"
          isOpen={!!confirmId}
          title="Eliminar favorito"
          message={`Se eliminara "${plantillaEnConfirm.name}". No se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={() => handleDelete(plantillaEnConfirm.id)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </>
  );
}
