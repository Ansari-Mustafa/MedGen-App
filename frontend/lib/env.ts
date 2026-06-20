const requireEnv = (key: string, value: string | undefined): string => {
  if (!value) {
    if (typeof window === "undefined") {
      return "";
    }
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
};

export const env = {
  API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  SUPABASE_URL: requireEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ),
  SUPABASE_ANON_KEY: requireEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ),
};

export const APP_NAME = "MedGen";
