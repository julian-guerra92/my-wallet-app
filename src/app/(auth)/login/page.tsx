"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = event.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const result = await signIn("credentials", { email, password, redirect: false });

    setLoading(false);

    if (result?.error) {
      setError("Credenciales inválidas.");
    } else {
      router.push("/verify-2fa");
    }
  }

  return (
    <div className="card bg-base-200 w-full max-w-sm shadow-xl">
      <div className="card-body">
        <h1 className="card-title text-2xl font-bold mb-2">Mi Billetera</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="form-control">
            <span className="label-text mb-1">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="input input-bordered w-full"
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Contraseña</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="input input-bordered w-full"
            />
          </label>
          {error && <p className="text-error text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
