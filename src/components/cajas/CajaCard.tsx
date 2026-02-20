"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { Account } from "@/types";

interface CajaCardProps {
  caja: Account;
  onArchive: (id: string) => void;
}

function formatBalance(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getProgressColor(pct: number): string {
  if (pct >= 80) return "bg-success";
  if (pct >= 50) return "bg-warning";
  return "bg-error";
}

export function CajaCard({ caja, onArchive }: CajaCardProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const pct =
    caja.isGoal && caja.targetAmount && caja.targetAmount > 0
      ? Math.min(100, Math.round((caja.balance / caja.targetAmount) * 100))
      : 0;

  function handleCardClick() {
    router.push(`/cajas/${caja.id}`);
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    router.push(`/cajas/${caja.id}/editar`);
  }

  function handleArchiveClick(e: React.MouseEvent) {
    e.stopPropagation();
    setShowConfirm(true);
  }

  function handleConfirmArchive() {
    setShowConfirm(false);
    onArchive(caja.id);
  }

  function handleCancelArchive() {
    setShowConfirm(false);
  }

  return (
    <>
      <div onClick={handleCardClick} className="cursor-pointer">
      <Card className="hover:border-white/15 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-2xl leading-none">{caja.icon ?? "💳"}</span>
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: caja.color ?? "#1e1e2e" }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate">{caja.name}</span>
              {caja.isGoal && (
                <span className="badge badge-primary badge-sm shrink-0">Meta</span>
              )}
            </div>
            <span className="text-sm text-base-content/60">
              {formatBalance(caja.balance)}
            </span>
          </div>

          <div className="dropdown dropdown-end shrink-0" onClick={(e) => e.stopPropagation()}>
            <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
              <MoreVertical size={18} />
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-200 rounded-box z-10 w-36 p-1 shadow-lg border border-white/10"
            >
              <li>
                <button onClick={handleEdit} className="rounded-lg">Editar</button>
              </li>
              <li>
                <button onClick={handleArchiveClick} className="text-error rounded-lg">
                  Archivar
                </button>
              </li>
            </ul>
          </div>
        </div>

        {caja.isGoal && caja.targetAmount && (
          <div className="mt-3 flex flex-col gap-1">
            <div className="w-full bg-base-300 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor(pct)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-base-content/50">
              <span>{formatBalance(caja.balance)} de {formatBalance(caja.targetAmount)}</span>
              <span className="font-semibold">{pct}%</span>
            </div>
          </div>
        )}
      </Card>
    </div>

    <ConfirmModal
      id={`archive-modal-${caja.id}`}
      isOpen={showConfirm}
      title="Archivar caja"
      message={`¿Estás seguro de que quieres archivar "${caja.name}"? La caja dejará de aparecer en el listado, pero su historial se conservará.`}
      confirmLabel="Archivar"
      cancelLabel="Cancelar"
      confirmVariant="btn-error"
      onConfirm={handleConfirmArchive}
      onCancel={handleCancelArchive}
    />
  </>
  );
}
