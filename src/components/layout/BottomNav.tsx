"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, Plus, Target, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Inicio", href: "/", icon: Home },
    { name: "Cajas", href: "/cajas", icon: Wallet },
    { name: "Agregar", href: "/agregar", icon: Plus, isFab: true },
    { name: "Metas", href: "/metas", icon: Target },
    { name: "Perfil", href: "/perfil", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-neutral/90 backdrop-blur-lg border-t border-white/5 pb-safe">
      <div className="grid grid-cols-5 h-full items-center justify-items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isFab) {
            return (
              <div key={item.name} className="relative -top-6">
                <Link
                  href={item.href}
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-content shadow-lg shadow-primary/40"
                >
                  <Icon size={28} strokeWidth={2.5} />
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                isActive ? "text-secondary" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}