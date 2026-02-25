import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const plantillas = await prisma.transactionTemplate.findMany({
    where: { userId },
    include: { account: { select: { name: true, icon: true, color: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(plantillas, { status: 200 });
}

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { name, amount, type, description, accountId } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 });
  }
  if (type !== "INCOME" && type !== "EXPENSE") {
    return NextResponse.json({ error: "Tipo invalido" }, { status: 400 });
  }
  if (!description || typeof description !== "string" || description.trim() === "") {
    return NextResponse.json({ error: "La descripcion es requerida" }, { status: 400 });
  }
  if (!accountId || typeof accountId !== "string") {
    return NextResponse.json({ error: "accountId es requerido" }, { status: 400 });
  }

  const cuenta = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!cuenta) {
    return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
  }

  const plantilla = await prisma.transactionTemplate.create({
    data: { name: name.trim(), amount, type, description: description.trim(), accountId, userId },
  });

  return NextResponse.json(plantilla, { status: 201 });
}
