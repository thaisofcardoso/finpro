import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinPro — Gestão Financeira",
  description: "Sistema de gestão financeira para pequenas empresas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'DM Sans', system-ui, sans-serif", margin: 0, padding: 0, backgroundColor: "#0a0a0a", color: "#e8e8e8" }}>
        {children}
      </body>
    </html>
  );
}
