import type { User } from "@/types/models";

export function canManageTemplates(user: User | null | undefined): boolean {
  return user?.role === "doctor";
}

export function isDoctor(user: User | null | undefined): boolean {
  return user?.role === "doctor";
}

export function isSecretary(user: User | null | undefined): boolean {
  return user?.role === "secretary";
}
