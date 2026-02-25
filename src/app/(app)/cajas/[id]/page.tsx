import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { CajaTransacciones } from "@/components/transacciones/CajaTransacciones";
import { formatBalance } from "@/lib/format";
import { getProgressColor } from "@/lib/meta-utils";

interface CajaDetailPageProps {
  params: Promise<{ id: string }>;
}

function getProgressTextColor(pct: number): string {
  if (pct >= 80) return "text-success";
  if (pct >= 50) return "text-warning";
  return "text-error";
}

export default async function CajaDetailPage({ params }: CajaDetailPageProps) {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    redirect("/login");
    return null;
  }

  const { id } = await params;

  const [caja, transacciones] = await Promise.all([
    prisma.account.findFirst({
      where: { id, userId, isArchived: false },
    }),
    prisma.transaction.findMany({
      where: { accountId: id, account: { userId } },
      include: { account: { select: { name: true, icon: true, color: true } } },
      orderBy: { date: "desc" },
      take: 50,
    }),
  ]);

  if (!caja) {
    redirect("/cajas");
    return null;
  }

  const pct =
    caja.isGoal && caja.targetAmount && caja.targetAmount > 0
      ? Math.min(100, Math.round((caja.balance / caja.targetAmount) * 100))
      : 0;

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/cajas" className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none">{caja.icon ?? "💳"}</span>
            <h1 className="text-xl font-bold">{caja.name}</h1>
          </div>
        </div>
        <Link href={`/cajas/${caja.id}/editar`} className="btn btn-ghost btn-sm btn-circle">
          <Pencil size={18} />
        </Link>
      </header>

      {caja.isThirdParty && (
        <div role="alert" className="alert alert-info text-sm">
          <span>
            Este bolsillo administra fondos de un tercero. Los movimientos no afectan tu saldo personal.
          </span>
        </div>
      )}

      <div className="card bg-neutral border border-white/5 shadow-xl">
        <div className="card-body p-5 gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: caja.color ?? "#1e1e2e" }}
            />
            <span className="text-sm text-base-content/50">
              {caja.isGoal ? "Meta de Ahorro" : "Caja"}
            </span>
          </div>

          <div>
            <p className="text-xs text-base-content/40 uppercase tracking-widest mb-1">
              Saldo actual
            </p>
            <p className="text-3xl font-bold">{formatBalance(caja.balance)}</p>
          </div>

          {caja.isGoal && caja.targetAmount && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-base-content/50">
                  Objetivo: {formatBalance(caja.targetAmount)}
                </span>
                <span className={`font-bold ${getProgressTextColor(pct)}`}>
                  {pct}%
                </span>
              </div>
              <div className="w-full bg-base-300 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all ${getProgressColor(pct)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-base-content/40">
                Faltan {formatBalance(Math.max(0, caja.targetAmount - caja.balance))} para la meta
              </p>
            </div>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
          Movimientos
        </h2>
        <CajaTransacciones transacciones={transacciones} />
      </section>

      <Link
        href={`/agregar?cajaId=${caja.id}`}
        className="btn btn-primary btn-circle fixed bottom-28 right-4 shadow-lg"
      >
        <Plus size={22} />
      </Link>
    </div>
  );
}
