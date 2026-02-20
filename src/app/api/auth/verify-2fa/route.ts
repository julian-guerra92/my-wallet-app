import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifySync } from "otplib";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token?.userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { code } = await req.json();

  if (!code) {
    return NextResponse.json({ error: "Código requerido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: token.userId },
    select: { twoFaSecret: true },
  });

  if (!user?.twoFaSecret) {
    return NextResponse.json({ error: "2FA no configurado" }, { status: 400 });
  }

  const result = verifySync({ token: code, secret: user.twoFaSecret });
  const isValid = result.valid;

  if (!isValid) {
    return NextResponse.json({ error: "Código inválido" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
