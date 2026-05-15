import type { WeekDay } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;

const dayLabels = [
  ["Segunda", "Seg"],
  ["Terça", "Ter"],
  ["Quarta", "Qua"],
  ["Quinta", "Qui"],
  ["Sexta", "Sex"],
  ["Sábado", "Sáb"],
  ["Domingo", "Dom"],
] as const;

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const mondayOffset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - mondayOffset);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function getIsoWeek(date: Date): string {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function getWeekDays(anchorDate: Date): WeekDay[] {
  const monday = startOfWeek(anchorDate);
  return dayLabels.map(([label, shortLabel], index) => ({
    key: label.toLowerCase(),
    label,
    shortLabel,
    date: toDateKey(addDays(monday, index)),
  }));
}

export function isTimestampInsideWeek(timestamp: number | undefined, anchorDate: Date): boolean {
  if (!timestamp) return false;
  const start = startOfWeek(anchorDate).getTime();
  const end = addDays(startOfWeek(anchorDate), 7).getTime();
  return timestamp >= start && timestamp < end;
}
