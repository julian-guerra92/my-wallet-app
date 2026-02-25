"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { Transaction, Account } from "@/types";

interface TransaccionItemProps {
  transaction: Transaction & { account: Pick<Account, "name" | "icon" | "color"> };
  onDelete?: (id: string) => void;
  showOptions?: boolean;
}

function formatDate(value: Date | string): string {
  const d = new Date(value);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export function TransaccionItem({ transaction, onDelete, showOptions = true }: TransaccionItemProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isIncome = transaction.type === "INCOME";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleEdit() {
    setMenuOpen(false);
    router.push(`/transacciones/${transaction.id}/editar`);
  }

  function handleDeleteConfirmed() {
    setConfirmOpen(false);
    onDelete?.(transaction.id);
  }

  const iconBg = transaction.account.color ?? "#6b7280";
  const icon = transaction.account.icon ?? "💳";

  return (
    <>
      <div className="flex items-center gap-3 py-3">
        {/* Ícono de la caja */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: `${iconBg}33` }}
        >
          {icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{transaction.description}</p>
          <p className="text-xs text-base-content/50 truncate">
            {transaction.account.name} · {formatDate(transaction.date)}
          </p>
        </div>

        {/* Monto */}
        <span
          className={`text-sm font-semibold shrink-0 ${isIncome ? "text-success" : "text-error"}`}
        >
          {isIncome ? "+" : "-"}${transaction.amount.toLocaleString("es-CO")}
        </span>

        {/* Menú de opciones */}
        {showOptions && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="btn btn-ghost btn-xs px-1"
              aria-label="Opciones"
            >
              <MoreVertical size={18} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-32 bg-base-100 border border-base-300 rounded-xl shadow-lg overflow-hidden">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-base-200 transition-colors"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); setConfirmOpen(true); }}
                  className="w-full px-4 py-2 text-left text-sm text-error hover:bg-base-200 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        id={`confirm-delete-tx-${transaction.id}`}
        isOpen={confirmOpen}
        title="Eliminar transaccion"
        message="Esta accion revertira el saldo de la caja. No se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
