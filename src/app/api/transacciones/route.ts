import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { applyBalance } from "@/lib/balance";
import { TransactionType } from "@/types/transaction";

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
  const { amount, type, description, date, accountId, saveAsTemplate, templateName, destinationAccountId } = body;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 });
  }
  if (type !== TransactionType.INCOME && type !== TransactionType.EXPENSE && type !== TransactionType.TRANSFER) {
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
    return NextResponse.json({ error: "Caja origen no encontrada" }, { status: 404 });
  }

  let cuentaDestino;
  if (type === TransactionType.TRANSFER) {
    if (!destinationAccountId || typeof destinationAccountId !== "string") {
       return NextResponse.json({ error: "destinationAccountId es requerido para transferencias" }, { status: 400 });
    }
    if (accountId === destinationAccountId) {
       return NextResponse.json({ error: "La caja de origen y destino no pueden ser la misma" }, { status: 400 });
    }
    cuentaDestino = await prisma.account.findFirst({
       where: { id: destinationAccountId, userId },
    });
    if (!cuentaDestino) {
       return NextResponse.json({ error: "Caja destino no encontrada" }, { status: 404 });
    }
  }

  const txDate = date ? new Date(date) : new Date();

  if (saveAsTemplate === true) {
    if (!templateName || typeof templateName !== "string" || templateName.trim() === "") {
      return NextResponse.json({ error: "El nombre del favorito es requerido" }, { status: 400 });
    }
  }

  const cleanTemplateName: string | undefined =
    saveAsTemplate === true ? (templateName as string).trim() : undefined;

  const ops: any[] = [];
  
  if (type === TransactionType.TRANSFER) {
    const groupId = crypto.randomUUID();
    ops.push(
      prisma.transaction.create({
        data: { amount, type: TransactionType.EXPENSE, description: description.trim(), date: txDate, accountId, isTransfer: true, linkedAccountId: destinationAccountId, groupId },
      }),
      applyBalance({ accountId, type: TransactionType.EXPENSE, amount }),
      prisma.transaction.create({
        data: { amount, type: TransactionType.INCOME, description: description.trim(), date: txDate, accountId: destinationAccountId, isTransfer: true, linkedAccountId: accountId, groupId },
      }),
      applyBalance({ accountId: destinationAccountId, type: TransactionType.INCOME, amount })
    );
  } else {
    ops.push(
      prisma.transaction.create({
        data: { amount, type, description: description.trim(), date: txDate, accountId },
      }),
      applyBalance({ accountId, type, amount }),
      ...(cleanTemplateName !== undefined
        ? [
          prisma.transactionTemplate.create({
            data: {
              name: cleanTemplateName,
              amount,
              type,
              description: description.trim(),
              accountId,
              userId,
            },
          }),
        ]
        : [])
    );
  }

  const result = await prisma.$transaction(ops);

  return NextResponse.json(result[0], { status: 201 });
}
