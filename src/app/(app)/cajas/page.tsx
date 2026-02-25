import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { CajaList } from "@/components/cajas/CajaList";

export default async function CajasPage() {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    redirect("/login");
    return null;
  }

  const accounts = await prisma.account.findMany({
    where: { userId, isArchived: false },
    orderBy: { name: "asc" },
  });

  type AccountRow = (typeof accounts)[number];
  const propias = accounts.filter((a: AccountRow) => !a.isGoal && !a.isThirdParty);
  const metas = accounts.filter((a: AccountRow) => a.isGoal);
  const terceros = accounts.filter((a: AccountRow) => a.isThirdParty && !a.isGoal);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Mis Cajas</h1>
        <Link href="/cajas/nueva" className="btn btn-primary btn-sm btn-circle">
          <Plus size={18} />
        </Link>
      </header>

      <CajaList cajas={propias} metas={metas} terceros={terceros} />
    </div>
  );
}
