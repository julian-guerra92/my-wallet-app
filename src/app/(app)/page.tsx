import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { HistorialGlobal } from "@/components/home/HistorialGlobal";
import { formatBalance } from "@/lib/format";

export default async function Home() {
  let userId: string;
  try {
    userId = await getAuthenticatedUserId();
  } catch {
    redirect("/login");
    return null;
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  const greeting = email.split("@")[0];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [accounts, monthIncome, monthExpenses, recentTransactions, totalTransactions] = await Promise.all([
    prisma.account.findMany({
      where: { userId, isArchived: false, isThirdParty: false, isGoal: false },
      select: { balance: true },
    }),
    prisma.transaction.aggregate({
      where: {
        account: { userId },
        type: "INCOME",
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        account: { userId },
        type: "EXPENSE",
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { account: { userId } },
      include: { account: { select: { name: true, icon: true, color: true } } },
      orderBy: { date: "desc" },
      take: 20,
    }),
    prisma.transaction.count({
      where: { account: { userId } },
    }),
  ]);

  const totalBalance = accounts.reduce((sum: number, a: { balance: number }) => sum + a.balance, 0);
  const totalIncome = monthIncome._sum.amount ?? 0;
  const totalExpenses = monthExpenses._sum.amount ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Hola, {greeting} 👋</h1>
          <p className="text-sm text-gray-400">Tus finanzas al día</p>
        </div>
      </header>

      <Card className="bg-linear-to-br from-neutral to-neutral/50">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-400 font-medium">Balance Líquido</p>
            <h2 className="text-4xl font-bold text-white mt-1">{formatBalance(totalBalance)}</h2>
            <p className="text-xs text-base-content/30 mt-1">Solo cajas propias y corrientes</p>
          </div>
          <div className="p-2 bg-primary/20 rounded-lg text-primary">
            <Wallet size={24} />
          </div>
        </div>

        <div className="flex gap-4 mt-3 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-success/20 rounded-full text-success">
              <ArrowUpCircle size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Ingresos</p>
              <p className="text-sm font-semibold text-success">{formatBalance(totalIncome)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-error/20 rounded-full text-error">
              <ArrowDownCircle size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Gastos</p>
              <p className="text-sm font-semibold text-error">{formatBalance(totalExpenses)}</p>
            </div>
          </div>
        </div>
      </Card>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Movimientos</h3>
          <Link href="/cajas" className="text-xs text-secondary hover:underline">
            Ver cajas
          </Link>
        </div>

        <HistorialGlobal
          initialTransactions={recentTransactions}
          totalCount={totalTransactions}
        />
      </section>
    </div>
  );
}