import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatPhone(phone: string): string {
  // Remove @s.whatsapp.net ou @c.us do final (apenas na exibição)
  let cleanPhone = phone.replace(/@s\.whatsapp\.net$/i, "").replace(/@c\.us$/i, "");

  // Remove caracteres não numéricos
  const cleaned = cleanPhone.replace(/\D/g, "");

  // Remove código do país (55) se presente (13 dígitos = 55 + DDD + número)
  let finalNumber = cleaned;
  if (cleaned.length === 13 && cleaned.startsWith("55")) {
    finalNumber = cleaned.slice(2);
  }

  // Formata o número
  if (finalNumber.length === 11) {
    return `(${finalNumber.slice(0, 2)}) ${finalNumber.slice(2, 7)}-${finalNumber.slice(7)}`;
  }
  if (finalNumber.length === 10) {
    return `(${finalNumber.slice(0, 2)}) ${finalNumber.slice(2, 6)}-${finalNumber.slice(6)}`;
  }
  return finalNumber || phone;
}

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, "");
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, "");
  return cleaned.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5"
  );
}

export function formatKWp(value: number): string {
  return `${value.toFixed(2)} kWp`;
}

export function calculateSystemPrice(kwp: number, pricePerKwp: number = 4500): number {
  return kwp * pricePerKwp;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
