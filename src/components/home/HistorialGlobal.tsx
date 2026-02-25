"use client";

import { useState } from "react";
import { TransaccionItem } from "@/components/transacciones/TransaccionItem";
import type { Transaction, Account } from "@/types";

type TransactionWithAccount = Transaction & {
  account: Pick<Account, "name" | "icon" | "color">;
};

interface HistorialGlobalProps {
  initialTransactions: TransactionWithAccount[];
  totalCount: number;
}

export function HistorialGlobal({ initialTransactions, totalCount }: HistorialGlobalProps) {
  const [items, setItems] = useState<TransactionWithAccount[]>(initialTransactions);
  const [skip, setSkip] = useState(initialTransactions.length);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = items.length < totalCount;

  async function loadMore() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/transacciones?skip=${skip}&limit=20`);
      const newItems: TransactionWithAccount[] = await res.json();
      setItems((prev) => [...prev, ...newItems]);
      setSkip((prev) => prev + newItems.length);
    } finally {
      setIsLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <span className="text-4xl">📭</span>
        <p className="text-base-content/50 text-sm">Aun no hay transacciones recientes.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-base-300">
        {items.map((t) => (
          <TransaccionItem key={t.id} transaction={t} showOptions={false} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoading}
            className="btn btn-ghost btn-sm"
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                Cargando...
              </>
            ) : (
              "Cargar más"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
