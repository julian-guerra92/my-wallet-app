"use client";

import { useState, useRef, useEffect } from "react";
import { Star, ChevronDown } from "lucide-react";
import type { Account, Transaction, TransactionTemplate, TransaccionFormData } from "@/types";
import { TransactionType } from "@/types/transaction";

interface TransaccionFormProps {
  cajas: Account[];
  plantillas: TransactionTemplate[];
  initialData?: Partial<Transaction>;
  preselectedCajaId?: string;
  onSubmit: (data: TransaccionFormData) => Promise<void>;
  isLoading: boolean;
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

function applyThousands(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("es-CO");
}

function parseDisplay(display: string): number {
  const digits = display.replace(/\./g, "");
  return parseFloat(digits) || 0;
}

function toDisplayValue(num: number): string {
  if (num === 0) return "";
  return num.toLocaleString("es-CO");
}

function toDateString(value: Date | string | undefined): string {
  if (!value) return todayString();
  const d = new Date(value);
  if (isNaN(d.getTime())) return todayString();
  return d.toISOString().split("T")[0];
}

export function TransaccionForm({
  cajas,
  plantillas,
  initialData,
  preselectedCajaId,
  onSubmit,
  isLoading,
}: TransaccionFormProps) {
  const [type, setType] = useState<TransaccionFormData["type"]>(
    (initialData?.type as TransaccionFormData["type"]) ?? TransactionType.EXPENSE
  );
  const [amountDisplay, setAmountDisplay] = useState(toDisplayValue(initialData?.amount ?? 0));
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [date, setDate] = useState(toDateString(initialData?.date));
  const [accountId, setAccountId] = useState(
    initialData?.accountId ?? preselectedCajaId ?? cajas[0]?.id ?? ""
  );
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showFavoritos, setShowFavoritos] = useState(false);
  const [showCajas, setShowCajas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cajasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowFavoritos(false);
      }
      if (cajasRef.current && !cajasRef.current.contains(e.target as Node)) {
        setShowCajas(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function applyTemplate(t: TransactionTemplate) {
    setType(t.type as TransaccionFormData["type"]);
    setAmountDisplay(toDisplayValue(t.amount));
    setDescription(t.description);
    setAccountId(t.accountId);
    setShowFavoritos(false);
    setShowCajas(false);
    setSaveAsTemplate(false);
  }

  const selectedCaja = cajas.find((c) => c.id === accountId);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const amount = parseDisplay(amountDisplay);
    if (!amount || amount <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }
    if (!description.trim()) {
      setError("La descripcion es requerida.");
      return;
    }
    if (!accountId) {
      setError("Selecciona una caja.");
      return;
    }
    if (type === TransactionType.TRANSFER) {
      if (!destinationAccountId) {
        setError("Selecciona una caja de destino.");
        return;
      }
      if (accountId === destinationAccountId) {
        setError("La caja origen y destino no pueden ser la misma.");
        return;
      }
    }
    if (saveAsTemplate && !templateName.trim()) {
      setError("El nombre del favorito es requerido.");
      return;
    }

    await onSubmit({
      amount,
      type,
      description: description.trim(),
      date,
      accountId,
      destinationAccountId: type === TransactionType.TRANSFER ? destinationAccountId : undefined,
      saveAsTemplate: type === TransactionType.TRANSFER ? false : saveAsTemplate,
      templateName: saveAsTemplate && type !== TransactionType.TRANSFER ? templateName.trim() : undefined,
    });
  }

  const isIncome = type === TransactionType.INCOME;
  const isTransfer = type === TransactionType.TRANSFER;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="alert alert-error text-sm py-2 px-4">{error}</div>
      )}

      <div
        className={`rounded-2xl p-1 flex transition-colors duration-200 ${isIncome ? "bg-success/20" : isTransfer ? "bg-primary/20" : "bg-error/20"
          }`}
      >
        <button
          type="button"
          onClick={() => setType(TransactionType.EXPENSE)}
          className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors duration-200 ${type === TransactionType.EXPENSE ? "bg-base-100 shadow text-error" : "text-base-content/50"
            }`}
        >
          GASTO
        </button>
        <button
          type="button"
          onClick={() => setType(TransactionType.TRANSFER)}
          className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors duration-200 ${isTransfer ? "bg-base-100 shadow text-primary" : "text-base-content/50"
            }`}
        >
          TRASLADO
        </button>
        <button
          type="button"
          onClick={() => setType(TransactionType.INCOME)}
          className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors duration-200 ${isIncome ? "bg-base-100 shadow text-success" : "text-base-content/50"
            }`}
        >
          INGRESO
        </button>
      </div>

      {!isTransfer && (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowFavoritos((v) => !v)}
            className="btn btn-outline btn-sm gap-2 w-full"
          >
            <Star size={16} className="text-primary" />
            Usar Favorito
          </button>

          {showFavoritos && (
            <div className="absolute z-10 mt-1 w-full bg-base-100 border border-base-300 rounded-xl shadow-lg max-h-56 overflow-y-auto">
              {plantillas.length === 0 ? (
                <p className="text-sm text-base-content/50 p-4 text-center">
                  Aun no tienes favoritos
                </p>
              ) : (
                plantillas.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-base-200 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-base-content/50">
                        {t.description} · {t.account?.name ?? ""}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${t.type === TransactionType.INCOME ? "text-success" : "text-error"
                        }`}
                    >
                      {t.type === TransactionType.INCOME ? "+" : "-"}${t.amount.toLocaleString("es-CO")}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="form-control gap-1">
        <label className="label label-text">Monto</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-mono text-base-content/60">
            $
          </span>
          <input
            type="text"
            inputMode="numeric"
            className="input input-bordered w-full text-3xl font-mono pl-10 h-16"
            placeholder="0"
            value={amountDisplay}
            onChange={(e) => setAmountDisplay(applyThousands(e.target.value))}
          />
        </div>
      </div>

      <div className="form-control gap-1">
        <label className="label label-text">Descripcion</label>
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Ej: Almuerzo de cumpleaños de Sarita"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="form-control gap-1">
        <label className="label label-text">Fecha</label>
        <input
          type="date"
          className="input input-bordered w-full"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="form-control gap-1">
        <label className="label label-text">{isTransfer ? "Caja Origen" : "Caja"}</label>
        <select
          className="select select-bordered w-full h-12"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          <option value="" disabled>Selecciona una caja</option>
          {cajas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon ? c.icon + " " : ""}{c.name}
            </option>
          ))}
        </select>
      </div>

      {isTransfer && (
        <div className="form-control gap-1">
          <label className="label label-text">Caja Destino</label>
          <select
            className="select select-bordered w-full h-12"
            value={destinationAccountId}
            onChange={(e) => setDestinationAccountId(e.target.value)}
          >
            <option value="" disabled>Selecciona la caja destino</option>
            {cajas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? c.icon + " " : ""}{c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!isTransfer && (
        <div className="form-control gap-2">
          <label className="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
            />
            <span className="label-text">Guardar como favorito</span>
          </label>
          {saveAsTemplate && (
            <input
              type="text"
              className="input input-bordered w-full mt-3"
              placeholder='Nombre del favorito (ej: "Pago Arriendo")'
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={`btn w-full ${isTransfer ? "btn-primary" : isIncome ? "btn-success" : "btn-error"}`}
      >
        {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
      </button>
    </form>
  );
}
