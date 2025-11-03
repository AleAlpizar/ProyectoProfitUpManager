import { apiJson } from "../../helpers/apiClient";

const API = process.env.NEXT_PUBLIC_API_BASE_URL!;

export type Role = "Administrador" | "Empleado";
export type Status = "ACTIVE" | "PAUSED" | "VACATION";

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
  telefono?: string | null;
  rol: Role | string;
  isActive: boolean;
  estadoUsuario?: Status;
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

export type UpdateUserInput = Partial<{
  nombre: string;
  apellido?: string;
  correo: string;
  telefono?: string | null;
  rol: Role;
}>;

export async function updateUser(
  usuarioId: number,
  payload: UpdateUserInput,
  authHeader: Record<string, string>
) {
  const url = `${API}/auth/users/${usuarioId}`;
  return apiJson<{ usuarioId: number }>(url, "PATCH", payload, authHeader);
}

export async function setUserStatus(
  usuarioId: number,
  status: Status,
  authHeader: Record<string, string>
) {
  const url = `${API}/auth/users/${usuarioId}/status/${status}`;
  return apiJson<{ usuarioId: number; estado: Status }>(url, "PATCH", {}, authHeader);
}
