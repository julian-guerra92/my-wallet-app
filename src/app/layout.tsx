import type { Metadata } from "next";
import { Inter } from "next/font/google"; // O la fuente que prefieras
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My Wallet",
  description: "Gestión financiera personal",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="mywallet">
      <body className={`${inter.className} bg-base-100 text-base-content min-h-screen`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}