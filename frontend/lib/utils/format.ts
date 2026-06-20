import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from "date-fns";

export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = typeof input === "string" ? parseISO(input) : input;
  return format(d, "PP");
}

export function formatDateTime(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = typeof input === "string" ? parseISO(input) : input;
  return format(d, "PP p");
}

export function formatRelative(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = typeof input === "string" ? parseISO(input) : input;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatAppointmentTime(input: string | null | undefined): string {
  if (!input) return "Unscheduled";
  const d = parseISO(input);
  if (isToday(d)) return `Today, ${format(d, "p")}`;
  if (isTomorrow(d)) return `Tomorrow, ${format(d, "p")}`;
  return format(d, "PP p");
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const avatarColors: Record<string, string> = {
  A: "#3B82F6", B: "#3B82F6", C: "#3B82F6", D: "#3B82F6", E: "#3B82F6",
  F: "#0891B2", G: "#0891B2", H: "#0891B2", I: "#0891B2", J: "#0891B2",
  K: "#059669", L: "#059669", M: "#059669", N: "#059669", O: "#059669",
  P: "#D97706", Q: "#D97706", R: "#D97706", S: "#D97706", T: "#D97706",
  U: "#DC2626", V: "#DC2626", W: "#DC2626", X: "#DC2626", Y: "#DC2626",
  Z: "#7C3AED",
};

export function getAvatarColor(name: string | null | undefined): string {
  if (!name) return "#6B7280";
  const letter = name.charAt(0).toUpperCase();
  return avatarColors[letter] ?? "#3B82F6";
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
