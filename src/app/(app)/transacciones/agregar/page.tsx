import { redirect } from "next/navigation";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { AgregarTransaccionClient } from "@/components/transacciones/AgregarTransaccionClient";

interface PageProps {
  searchParams: Promise<{ cajaId?: string }>;
}

export default async function AgregarPage({ searchParams }: PageProps) {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    redirect("/login");
    return null;
  }

  const { cajaId } = await searchParams;

  const [cajas, plantillas] = await Promise.all([
    prisma.account.findMany({
      where: { userId, isArchived: false },
      orderBy: { name: "asc" },
    }),
    prisma.transactionTemplate.findMany({
      where: { userId },
      include: { account: { select: { name: true, icon: true, color: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AgregarTransaccionClient
      cajas={cajas}
      plantillas={plantillas}
      preselectedCajaId={cajaId}
    />
  );
}
