import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PlantillasClient } from "@/components/transacciones/PlantillasClient";

export default async function PlantillasPage() {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    redirect("/login");
    return null;
  }

  const plantillas = await prisma.transactionTemplate.findMany({
    where: { userId },
    include: { account: { select: { name: true, icon: true, color: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link href="/perfil" className="btn btn-ghost btn-sm btn-circle">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Favoritos</h1>
      </header>

      <PlantillasClient plantillas={plantillas} />
    </div>
  );
}
