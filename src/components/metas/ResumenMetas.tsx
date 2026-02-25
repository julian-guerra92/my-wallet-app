import { formatBalance } from "@/lib/format";

interface ResumenMetasProps {
  metas: Array<{ balance: number; targetAmount: number | null }>;
}

export function ResumenMetas({ metas }: ResumenMetasProps) {
  const metasActivas = metas.length;

  const metasEnVerde = metas.filter((meta) => {
    const montoObjetivo = meta.targetAmount ?? 0;
    if (montoObjetivo <= 0) return false;
    const porcentaje = (meta.balance / montoObjetivo) * 100;
    return porcentaje >= 80;
  }).length;

  const totalAcumulado = metas.reduce((suma, meta) => suma + meta.balance, 0);

  return (
    <div className="stats stats-horizontal bg-transparent w-full shadow-none border border-white/5 rounded-2xl">
      <div className="stat px-4 py-3">
        <div className="stat-title text-xs">Metas activas</div>
        <div className="stat-value text-2xl">{metasActivas}</div>
      </div>

      <div className="stat px-4 py-3">
        <div className="stat-title text-xs">En verde</div>
        <div className="stat-value text-2xl text-success">{metasEnVerde}</div>
      </div>

      <div className="stat px-4 py-3">
        <div className="stat-title text-xs">Total acumulado</div>
        <div className="stat-value text-lg">{formatBalance(totalAcumulado)}</div>
      </div>
    </div>
  );
}
