import type { AppointmentStatus } from "@/lib/types";

export function waLink(number: string, text: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function fmtPhone(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return digits;
}

export function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h}h${String(r).padStart(2, "0")}` : `${h}h`;
}

/** Parse "YYYY-MM-DD" as a local calendar date (no UTC shift). */
export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Index = backend weekday (0 = segunda).
export const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const STATUS_CLASS: Record<AppointmentStatus, string> = {
  pendente: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  confirmado: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  concluido: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  cancelado: "bg-red-500/15 text-red-300 border-red-500/30",
};
