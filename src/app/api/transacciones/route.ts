import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { applyBalance } from "@/lib/balance";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const skip = parseInt(searchParams.get("skip") ?? "0", 10);

  const transacciones = await prisma.transaction.findMany({
    where: { account: { userId } },
    include: { account: { select: { name: true, icon: true, color: true } } },
    orderBy: { date: "desc" },
    take: limit,
    skip,
  });

  return NextResponse.json(transacciones, { status: 200 });
}

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { amount, type, description, date, accountId, saveAsTemplate, templateName } = body;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 });
  }
  if (type !== "INCOME" && type !== "EXPENSE") {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
  if (!description || typeof description !== "string" || description.trim() === "") {
    return NextResponse.json({ error: "La descripción es requerida" }, { status: 400 });
  }
  if (!accountId || typeof accountId !== "string") {
    return NextResponse.json({ error: "accountId es requerido" }, { status: 400 });
  }

  const cuenta = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });
  if (!cuenta) {
    return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
  }

  const txDate = date ? new Date(date) : new Date();

  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.transaction.create({
      data: { amount, type, description: description.trim(), date: txDate, accountId },
    }),
    applyBalance({ accountId, type, amount }),
  ];

  if (saveAsTemplate === true) {
    if (!templateName || typeof templateName !== "string" || templateName.trim() === "") {
      return NextResponse.json({ error: "El nombre del favorito es requerido" }, { status: 400 });
    }
    ops.push(
      prisma.transactionTemplate.create({
        data: {
          name: templateName.trim(),
          amount,
          type,
          description: description.trim(),
          accountId,
          userId,
        },
      })
    );
  }

  const [transaccion] = await prisma.$transaction(ops);

  return NextResponse.json(transaccion, { status: 201 });
}
