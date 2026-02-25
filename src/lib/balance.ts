import { prisma } from "./prisma";

export interface BalanceOperation {
  accountId: string;
  type: string;
  amount: number;
}

function computeDelta(type: string, amount: number): number {
  return type === "INCOME" ? amount : -amount;
}

export function applyBalance({ accountId, type, amount }: BalanceOperation) {
  return prisma.account.update({
    where: { id: accountId },
    data: { balance: { increment: computeDelta(type, amount) } },
  });
}

export function revertBalance({ accountId, type, amount }: BalanceOperation) {
  return prisma.account.update({
    where: { id: accountId },
    data: { balance: { increment: -computeDelta(type, amount) } },
  });
}
