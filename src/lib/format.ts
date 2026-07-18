export function formatDateLabel(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
