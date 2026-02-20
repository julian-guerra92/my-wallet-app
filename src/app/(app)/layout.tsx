import { BottomNav } from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <main className="pb-24 px-4 pt-6 max-w-md mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
