import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import type { UpdateCajaBody } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const caja = await prisma.account.findFirst({
    where: { id, userId, isArchived: false },
  });

  if (!caja) {
    return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
  }

  return NextResponse.json(caja, { status: 200 });
}

export async function PUT(request: Request, { params }: RouteContext) {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.account.findFirst({
    where: { id, userId, isArchived: false },
  });

  if (!existing) {
    return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
  }

  const body: UpdateCajaBody = await request.json();
  const { name, icon, color, balance, isGoal, targetAmount } = body;

  if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
    return NextResponse.json({ error: "El nombre no puede estar vacío" }, { status: 400 });
  }

  if (balance !== undefined && (typeof balance !== "number" || balance < 0)) {
    return NextResponse.json({ error: "El saldo debe ser mayor o igual a 0" }, { status: 400 });
  }

  const resolvedIsGoal = isGoal ?? existing.isGoal;
  const resolvedTargetAmount = targetAmount ?? existing.targetAmount;

  if (resolvedIsGoal === true && (typeof resolvedTargetAmount !== "number" || resolvedTargetAmount <= 0)) {
    return NextResponse.json({ error: "El monto objetivo debe ser mayor a 0" }, { status: 400 });
  }

  const caja = await prisma.account.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(icon !== undefined && { icon }),
      ...(color !== undefined && { color }),
      ...(balance !== undefined && { balance }),
      ...(isGoal !== undefined && { isGoal }),
      ...(targetAmount !== undefined && { targetAmount: resolvedIsGoal ? targetAmount : null }),
    },
  });

  return NextResponse.json(caja, { status: 200 });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.account.findFirst({
    where: { id, userId, isArchived: false },
  });

  if (!existing) {
    return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 });
  }

  await prisma.account.update({
    where: { id },
    data: { isArchived: true },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
