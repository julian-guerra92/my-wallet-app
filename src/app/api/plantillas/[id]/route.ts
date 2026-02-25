import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const plantilla = await prisma.transactionTemplate.findFirst({
    where: { id, userId },
  });
  if (!plantilla) {
    return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
  }

  await prisma.transactionTemplate.delete({ where: { id } });

  return NextResponse.json({ ok: true }, { status: 200 });
}
