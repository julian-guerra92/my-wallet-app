import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getProgressColor, getProgressTextColor } from "@/lib/meta-utils";
import { formatearFechaEstimada } from "@/lib/meta-projection";
import { formatBalance } from "@/lib/format";
import type { Account } from "@/types/account";
import type { Transaction } from "@/types/transaction";

interface MetaCardProps {
  account: Account & {
    transactions: Transaction[];
  };
}

export function MetaCard({ account }: MetaCardProps) {
  const target = account.targetAmount ?? 0;
  const porcentaje = target > 0 ? Math.min(100, Math.round((account.balance / target) * 100)) : 0;
  const cumplida = account.balance >= target && target > 0;
  const faltante = Math.max(0, target - account.balance);
  const estadoFecha = target > 0
    ? formatearFechaEstimada(account.transactions, account.balance, target)
    : "Sin objetivo definido";

  return (
    <Link href={`/cajas/${account.id}`} className="block">
      <Card className="hover:border-white/15 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-2xl leading-none">{account.icon ?? "🎯"}</span>
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: account.color ?? "#1e1e2e" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold truncate">{account.name}</span>
              {account.isThirdParty && (
                <span className="badge badge-accent badge-outline badge-xs shrink-0">Tercero</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-1">
          <span className={`text-lg font-bold ${getProgressTextColor(porcentaje)}`}>{porcentaje}%</span>
        </div>

        <div className="w-full bg-base-300 rounded-full h-2.5 overflow-hidden mb-4">
          <div
            className={`h-2.5 rounded-full transition-all ${getProgressColor(porcentaje)}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <p className="text-base-content/50 text-xs mb-0.5">Saldo actual</p>
            <p className="font-semibold">{formatBalance(account.balance)}</p>
          </div>
          <div className="text-right">
            <p className="text-base-content/50 text-xs mb-0.5">Monto objetivo</p>
            <p className="font-semibold">{formatBalance(target)}</p>
          </div>
        </div>

        {cumplida ? (
          <div className="flex items-center gap-2 text-success font-semibold text-sm">
            <Trophy size={16} />
            <span>¡Meta cumplida! 🎉</span>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 text-sm text-base-content/60">
            <span>Falta: <span className="font-medium text-base-content/80">{formatBalance(faltante)}</span></span>
            <span className={getProgressTextColor(porcentaje)}>{estadoFecha}</span>
          </div>
        )}
      </Card>
    </Link>
  );
}
