import { AxiosError } from "axios";

export function extractApiError(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof AxiosError) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => d?.msg ?? String(d)).join(", ");
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}
