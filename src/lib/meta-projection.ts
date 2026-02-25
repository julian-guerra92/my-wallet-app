import type { Transaction } from "@/types";

export function calcularFechaEstimada(
  transactions: Transaction[],
  montoFaltante: number
): Date | null {
  if (transactions.length === 0) return null;

  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstDate = new Date(sorted[0].date);
  const today = new Date();
  const daysDiff = (today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysDiff < 7) return null;

  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    if (tx.type === "INCOME") {
      totalIncome += tx.amount;
    } else if (tx.type === "EXPENSE") {
      totalExpense += tx.amount;
    }
  }

  const netFlow = totalIncome - totalExpense;
  const mesesTranscurridos = daysDiff / 30.44;
  const ritmoMensualNeto = netFlow / mesesTranscurridos;

  if (ritmoMensualNeto <= 0) return null;

  const mesesRestantes = montoFaltante / ritmoMensualNeto;
  const fechaEstimada = new Date(today);
  fechaEstimada.setTime(
    fechaEstimada.getTime() + mesesRestantes * 30.44 * 24 * 60 * 60 * 1000
  );

  return fechaEstimada;
}

export function formatearFechaEstimada(
  transactions: Transaction[],
  balance: number,
  targetAmount: number
): string {
  if (balance >= targetAmount) return "¡Meta cumplida! 🎉";

  const montoFaltante = targetAmount - balance;
  const fecha = calcularFechaEstimada(transactions, montoFaltante);

  if (fecha === null) {
    const hasTransactions = transactions.length > 0;

    if (!hasTransactions) return "Sin actividad aún";

    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const firstDate = new Date(sorted[0].date);
    const today = new Date();
    const daysDiff = (today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff < 7) return "Sin actividad aún";

    return "Meta en retroceso";
  }

  return `Estimado: ${fecha.toLocaleDateString("es-CO", { month: "short", year: "numeric" })}`;
}
