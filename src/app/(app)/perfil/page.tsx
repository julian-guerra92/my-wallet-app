import { redirect } from "next/navigation";
import Link from "next/link";
import { Star, ChevronRight } from "lucide-react";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export default async function PerfilPage() {
  try {
    await getAuthenticatedUserId();
  } catch {
    redirect("/login");
    return null;
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-bold">Perfil</h1>
        <p className="text-sm text-base-content/50">{email}</p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
          Preferencias
        </h2>
        <Link
          href="/plantillas"
          className="flex items-center justify-between p-4 rounded-2xl bg-neutral border border-white/5 hover:bg-neutral/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-warning/20 flex items-center justify-center text-warning">
              <Star size={18} />
            </div>
            <span className="font-medium text-sm">Favoritos</span>
          </div>
          <ChevronRight size={18} className="text-base-content/30" />
        </Link>
      </section>
    </div>
  );
}
