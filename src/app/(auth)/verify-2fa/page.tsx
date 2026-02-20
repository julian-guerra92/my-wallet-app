"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Verify2FAPage() {
  const router = useRouter();
  const { update } = useSession();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = event.currentTarget;
    const code = (form.elements.namedItem("code") as HTMLInputElement).value;

    const res = await fetch("/api/auth/verify-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      setLoading(false);
      setError("Código inválido. Inténtalo de nuevo.");
      return;
    }

    await update({ is2FAVerified: true });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="card bg-base-200 w-full max-w-sm shadow-xl">
      <div className="card-body">
        <h1 className="card-title text-2xl font-bold mb-2">Verificación 2FA</h1>
        <p className="text-sm text-base-content/70 mb-2">
          Ingresa el código de 6 dígitos de tu app autenticadora.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            name="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            pattern="\d{6}"
            required
            placeholder="000000"
            className="input input-bordered w-full text-center text-2xl tracking-widest"
          />
          {error && <p className="text-error text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Verificar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
