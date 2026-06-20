import { api } from "@/lib/api/client";
import type { User } from "@/types/models";

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/me");
  return data;
}

export interface ProfileSetup {
  full_name: string;
  role: "doctor" | "secretary";
  doctor_id?: string;
  phone?: string;
}

export async function setupProfile(payload: ProfileSetup): Promise<User> {
  const { data } = await api.post<User>("/profiles/setup", payload);
  return data;
}

export interface ProfileUpdate {
  full_name?: string;
  phone?: string;
  expo_push_token?: string;
  avatar_url?: string;
}

export async function updateMe(payload: ProfileUpdate): Promise<User> {
  const { data } = await api.patch<User>("/me", payload);
  return data;
}
