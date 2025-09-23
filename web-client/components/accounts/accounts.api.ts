// web-client/components/accounts/accounts.api.ts
import { apiJson } from "@/helpers/apiClient";

const API = process.env.NEXT_PUBLIC_API_BASE_URL!;

export type Role = "Administrador" | "Empleado";

export type RegisterInput = {
  nombre: string;
  apellido?: string;
  correo: string;
  password: string;
  telefono?: string | null;
  rol: Role;
};

export type UserDto = {
  usuarioID: number;
  nombre: string;
  apellido?: string;
  correo: string;
  rol: Role;
  isActive: boolean;
};

export async function listUsers(authHeader: Record<string, string>) {
  return apiJson<UserDto[]>(`${API}/auth/users`, "GET", undefined, authHeader);
}

export async function createUser(input: RegisterInput, authHeader: Record<string, string>) {
  return apiJson<{ usuarioId: number }>(`${API}/auth/register`, "POST", input, authHeader);
}

export async function updateUserRole(usuarioId: number, rol: Role, authHeader: Record<string, string>) {
  const url = `${API}/auth/users/${usuarioId}/role/${encodeURIComponent(rol)}`;
  return apiJson<{ usuarioId: number; rol: string }>(url, "PATCH", {}, authHeader);
}
