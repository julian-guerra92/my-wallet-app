import { redirect } from "next/navigation";
import Link from "next/link";
import { Target } from "lucide-react";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { MetaCard } from "@/components/metas/MetaCard";
import { ResumenMetas } from "@/components/metas/ResumenMetas";

export default async function MetasPage() {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    redirect("/login");
    return null;
  }

  const metas = await prisma.account.findMany({
    where: { userId, isGoal: true, isArchived: false },
    include: {
      transactions: {
        orderBy: { date: "asc" },
      },
    },
  });

  const metasOrdenadas = [...metas].sort((a, b) => {
    const porcentajeA =
      a.targetAmount && a.targetAmount > 0
        ? Math.min(100, (a.balance / a.targetAmount) * 100)
        : 0;
    const porcentajeB =
      b.targetAmount && b.targetAmount > 0
        ? Math.min(100, (b.balance / b.targetAmount) * 100)
        : 0;

    const cumplirA = porcentajeA >= 100 ? 1 : 0;
    const cumplirB = porcentajeB >= 100 ? 1 : 0;

    if (cumplirA !== cumplirB) return cumplirA - cumplirB;

    return porcentajeB - porcentajeA;
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-bold">Mis Metas</h1>
      </header>

      {metas.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <Target size={48} className="text-base-content/20" />
          <div>
            <p className="font-semibold text-base-content/60">No tenés metas de ahorro aún</p>
            <p className="text-sm text-base-content/40 mt-1">Creá una caja como meta para comenzar a hacer seguimiento</p>
          </div>
          <Link href="/cajas/nueva?preset=goal" className="btn btn-primary btn-sm">
            Crear una meta
          </Link>
        </div>
      ) : (
        <>
          <ResumenMetas metas={metas} />

          <div className="flex flex-col gap-4">
            {metasOrdenadas.map((meta) => (
              <MetaCard key={meta.id} account={meta} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
