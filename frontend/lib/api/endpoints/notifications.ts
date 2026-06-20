import { api } from "@/lib/api/client";
import type { AppNotification } from "@/types/models";

export async function listNotifications(): Promise<AppNotification[]> {
  const { data } = await api.get<AppNotification[]>("/notifications");
  return data;
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  await api.post("/notifications/mark-read", { ids });
}
