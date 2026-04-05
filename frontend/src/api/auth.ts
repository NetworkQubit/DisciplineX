import { api } from "./client";
import type { AuthResponse, AuthUser } from "../types";

export async function loginUser(payload: { email: string; password: string }) {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function registerUser(payload: { username: string; email: string; password: string }) {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await api.get<{ user: AuthUser }>("/auth/me");
  return data.user;
}

export async function resetPassword(payload: { currentPassword: string; newPassword: string }) {
  const { data } = await api.post<{ message: string }>("/auth/password/reset", payload);
  return data;
}

export async function requestForgotPassword(payload: { email: string }) {
  const { data } = await api.post<{ message: string }>("/auth/forgot-password", payload);
  return data;
}

export async function confirmForgotPassword(payload: { email: string; token: string; newPassword: string }) {
  const { data } = await api.post<{ message: string }>("/auth/forgot-password/confirm", payload);
  return data;
}
