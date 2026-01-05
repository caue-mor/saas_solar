import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "SolarGestão - Sistema de Gestão para Empresas de Energia Solar",
    template: "%s | SolarGestão",
  },
  description:
    "Sistema completo de CRM e gestão para empresas de energia solar. Gerencie leads, propostas, instalações e atendimento com IA integrada.",
  keywords: [
    "energia solar",
    "crm solar",
    "gestão solar",
    "painel solar",
    "instalação solar",
    "proposta solar",
    "leads energia solar",
  ],
  authors: [{ name: "SolarGestão" }],
  creator: "SolarGestão",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "SolarGestão - Sistema de Gestão para Empresas de Energia Solar",
    description:
      "Sistema completo de CRM e gestão para empresas de energia solar.",
    siteName: "SolarGestão",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
