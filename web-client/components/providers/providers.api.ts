
import { apiJson } from "../../helpers/apiClient";

const API = process.env.NEXT_PUBLIC_API_BASE_URL!;

export type ProveedorDto = {
  proveedorID: number;
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  isActive: boolean;
};

export type ProveedorMiniDto = {
  proveedorID: number;
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  correo?: string | null;
};

export type ProveedorCreateInput = {
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
};

export type ProveedorUpdateInput = Partial<{
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  isActive: boolean;
}>;

export async function listProviders(authHeader: Record<string, string>) {
  return apiJson<ProveedorDto[]>(
    `${API}/api/proveedores?includeInactive=true`,
    "GET",
    undefined,
    authHeader
  );
}

export async function listActiveProvidersMini(
  authHeader: Record<string, string>
) {
  return apiJson<ProveedorMiniDto[]>(
    `${API}/api/proveedores/mini`,
    "GET",
    undefined,
    authHeader
  );
}

export async function createProvider(
  input: ProveedorCreateInput,
  authHeader: Record<string, string>
) {
  return apiJson<ProveedorDto>(
    `${API}/api/proveedores`,
    "POST",
    input,
    authHeader
  );
}

export async function updateProvider(
  proveedorId: number,
  payload: ProveedorUpdateInput,
  authHeader: Record<string, string>
) {
  return apiJson<ProveedorDto>(
    `${API}/api/proveedores/${proveedorId}`,
    "PUT",
    payload,
    authHeader
  );
}

export async function setProviderStatus(
  proveedorId: number,
  isActive: boolean,
  authHeader: Record<string, string>
) {
  return apiJson<void>(
    `${API}/api/proveedores/${proveedorId}/status/${isActive}`,
    "PATCH",
    {},
    authHeader
  );
}
