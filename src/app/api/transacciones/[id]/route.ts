import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { applyBalance, revertBalance } from "@/lib/balance";
import { Prisma } from "@prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteContext) {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const oldTx = await prisma.transaction.findFirst({
    where: { id, account: { userId } },
  });
  if (!oldTx) {
    return NextResponse.json({ error: "Transacción no encontrada" }, { status: 404 });
  }

  const body = await request.json();
  const { amount, type, description, date, accountId } = body;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 });
  }
  if (type !== "INCOME" && type !== "EXPENSE") {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
  if (!description || typeof description !== "string" || description.trim() === "") {
    return NextResponse.json({ error: "La descripción es requerida" }, { status: 400 });
  }

  const newAccountId: string = accountId ?? oldTx.accountId;

  if (newAccountId !== oldTx.accountId) {
    const cuenta = await prisma.account.findFirst({ where: { id: newAccountId, userId } });
    if (!cuenta) {
      return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
    }
  }

  const txDate = date ? new Date(date) : oldTx.date;

  const ops: Prisma.PrismaPromise<unknown>[] = [
    revertBalance({ accountId: oldTx.accountId, type: oldTx.type, amount: oldTx.amount }),
    applyBalance({ accountId: newAccountId, type, amount }),
    prisma.transaction.update({
      where: { id },
      data: { amount, type, description: description.trim(), date: txDate, accountId: newAccountId },
    }),
  ];

  const [, , transaccion] = await prisma.$transaction(ops);

  return NextResponse.json(transaccion, { status: 200 });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const tx = await prisma.transaction.findFirst({
    where: { id, account: { userId } },
  });
  if (!tx) {
    return NextResponse.json({ error: "Transacción no encontrada" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.transaction.delete({ where: { id } }),
    revertBalance({ accountId: tx.accountId, type: tx.type, amount: tx.amount }),
  ]);

  return NextResponse.json({ ok: true }, { status: 200 });
}
