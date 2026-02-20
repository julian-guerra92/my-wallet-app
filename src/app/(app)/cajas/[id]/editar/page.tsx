import { redirect } from "next/navigation";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { EditCajaClient } from "@/components/cajas/EditCajaClient";

interface EditCajaPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCajaPage({ params }: EditCajaPageProps) {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    redirect("/login");
    return null;
  }

  const { id } = await params;

  const caja = await prisma.account.findFirst({
    where: { id, userId, isArchived: false },
  });

  if (!caja) {
    redirect("/cajas");
    return null;
  }

  return <EditCajaClient caja={caja} />;
}
