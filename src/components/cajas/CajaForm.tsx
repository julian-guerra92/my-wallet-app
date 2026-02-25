"use client";

import { useState } from "react";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { SWATCHES } from "@/lib/constants";
import type { Account, CreateCajaBody } from "@/types";

interface CajaFormProps {
  initialData?: Account;
  onSubmit: (data: CreateCajaBody) => Promise<void>;
  isLoading: boolean;
}

function toDisplayValue(num: number): string {
  if (num === 0) return "";
  return num.toLocaleString("es-CO");
}

function applyThousands(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("es-CO");
}

function parseDisplay(display: string): number {
  const digits = display.replace(/\./g, "");
  return parseInt(digits, 10) || 0;
}

export function CajaForm({ initialData, onSubmit, isLoading }: CajaFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [icon, setIcon] = useState(initialData?.icon ?? "");
  const [color, setColor] = useState(initialData?.color ?? SWATCHES[0].hex);
  const [balanceDisplay, setBalanceDisplay] = useState(toDisplayValue(initialData?.balance ?? 0));
  const [isGoal, setIsGoal] = useState(initialData?.isGoal ?? false);
  const [isThirdParty, setIsThirdParty] = useState(initialData?.isThirdParty ?? false);
  const [targetDisplay, setTargetDisplay] = useState(toDisplayValue(initialData?.targetAmount ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);

  function handleNumberChange(
    value: string,
    setter: (v: string) => void
  ) {
    setter(applyThousands(value));
  }

  function handleNameChange(value: string) {
    setName(value);
    if (value.trim()) setNameError(false);
  }

  function showTargetError(msg: string) {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const balance = parseDisplay(balanceDisplay);
    const targetAmount = parseDisplay(targetDisplay);

    if (!name.trim()) {
      setNameError(true);
      return;
    }

    if (balance < 0) {
      setError("El saldo debe ser mayor o igual a 0.");
      return;
    }

    if (isGoal && targetAmount <= 0) {
      showTargetError("El monto objetivo debe ser mayor a 0.");
      return;
    }

    const data: CreateCajaBody = {
      name: name.trim(),
      icon: icon.trim() || "💳",
      color,
      balance,
      isGoal,
      targetAmount: isGoal ? targetAmount : undefined,
      isThirdParty,
    };

    await onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="alert alert-error text-sm py-2 px-4">
          {error}
        </div>
      )}

      <div className="form-control gap-1">
        <label className="label label-text">Nombre</label>
        <input
          type="text"
          className={`input input-bordered w-full ${nameError ? "input-error" : ""}`}
          placeholder="Ej: Cuenta corriente"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
        />
        {nameError && (
          <span className="text-error text-xs mt-1">El nombre es requerido.</span>
        )}
      </div>

      <div className="form-control gap-1">
        <label className="label label-text mr-3">Icono</label>
        <input
          type="text"
          className="input input-bordered w-20 text-2xl text-center"
          placeholder="💳"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          maxLength={2}
        />
      </div>

      <div className="form-control gap-1">
        <label className="label label-text">Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <div className="form-control gap-1">
        <label className="label label-text">Saldo inicial</label>
        <input
          type="text"
          inputMode="numeric"
          className="input input-bordered w-full"
          placeholder="0"
          value={balanceDisplay}
          onChange={(e) => handleNumberChange(e.target.value, setBalanceDisplay)}
        />
      </div>

      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-4">
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={isGoal}
            onChange={(e) => setIsGoal(e.target.checked)}
          />
          <span className="label-text">¿Es Meta de Ahorro?</span>
        </label>
      </div>

      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-4">
          <input
            type="checkbox"
            className="toggle toggle-accent"
            checked={isThirdParty}
            onChange={(e) => setIsThirdParty(e.target.checked)}
          />
          <span className="label-text">¿Dinero de un tercero?</span>
        </label>
        <p className="text-xs text-base-content/50 mt-1">
          Activa esto si administras fondos de otra persona. No afectará tu saldo personal.
        </p>
      </div>

      {isGoal && (
        <div className="form-control gap-1">
          <label className="label label-text">Monto objetivo</label>
          <input
            type="text"
            inputMode="numeric"
            className="input input-bordered w-full"
            placeholder="0"
            value={targetDisplay}
            onChange={(e) => handleNumberChange(e.target.value, setTargetDisplay)}
          />
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary w-full mt-2"
        disabled={isLoading}
      >
        {isLoading ? <span className="loading loading-spinner loading-sm" /> : initialData ? "Guardar cambios" : "Crear caja"}
      </button>
    </form>
  );
}
