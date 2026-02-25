import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import type { CreateCajaBody } from "@/types";

export async function GET() {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cajas = await prisma.account.findMany({
    where: { userId, isArchived: false },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(cajas, { status: 200 });
}

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body: CreateCajaBody = await request.json();
  const { name, icon, color, balance, isGoal, targetAmount, isThirdParty } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  if (typeof balance !== "number" || balance < 0) {
    return NextResponse.json({ error: "El saldo debe ser mayor o igual a 0" }, { status: 400 });
  }

  if (isGoal === true && (typeof targetAmount !== "number" || targetAmount <= 0)) {
    return NextResponse.json({ error: "El monto objetivo debe ser mayor a 0" }, { status: 400 });
  }

  const caja = await prisma.account.create({
    data: {
      name: name.trim(),
      icon: icon ?? null,
      color: color ?? null,
      balance,
      isGoal: isGoal ?? false,
      targetAmount: isGoal ? targetAmount : null,
      isThirdParty: isThirdParty ?? false,
      userId,
    },
  });

  return NextResponse.json(caja, { status: 201 });
}
