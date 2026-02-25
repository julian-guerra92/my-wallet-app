import { redirect, notFound } from "next/navigation";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { EditarTransaccionClient } from "@/components/transacciones/EditarTransaccionClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarTransaccionPage({ params }: PageProps) {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    redirect("/login");
    return null;
  }

  const { id } = await params;

  const [transaccion, cajas, plantillas] = await Promise.all([
    prisma.transaction.findFirst({
      where: { id, account: { userId } },
    }),
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

  if (!transaccion) {
    notFound();
  }

  return (
    <EditarTransaccionClient
      transaction={transaccion}
      cajas={cajas}
      plantillas={plantillas}
    />
  );
}
