import { env } from "@/lib/env";
import { getAuthToken } from "@/lib/api/client";

export async function buildSseUrl(path: string): Promise<string | null> {
  const token = await getAuthToken();
  if (!token) return null;
  const sep = path.includes("?") ? "&" : "?";
  return `${env.API_BASE_URL}${path}${sep}token=${encodeURIComponent(token)}`;
}
