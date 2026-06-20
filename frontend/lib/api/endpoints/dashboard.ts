import { api } from "@/lib/api/client";
import type { DashboardStats } from "@/types/models";

export async function getDashboard(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>("/dashboard");
  return data;
}
