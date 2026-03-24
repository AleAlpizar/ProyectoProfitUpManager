"use client";

import { useCallback, useMemo, useState } from "react";

export type ProductoCreate = {
  sku: string;
  nombre: string;
  descripcion?: string;
  codigoInterno?: string;
  unidadAlmacenamientoID?: number | null;
  bodegaID?: number | null;
  precioCosto: number | null;
  precioVenta: number | null;
  descuento?: number | null;
  peso?: number | null;
  largo?: number | null;
  alto?: number | null;
  ancho?: number | null;
};

export type ProductoCreateResult = { productoId: number };

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "auth_token";

const INITIAL_VALUES: ProductoCreate = {
  sku: "",
  nombre: "",
  descripcion: "",
  codigoInterno: "",
  unidadAlmacenamientoID: null,
  bodegaID: null,
  precioCosto: null,
  precioVenta: null,
  descuento: null,
  peso: null,
  largo: null,
  alto: null,
  ancho: null,
};

function isFiniteNumber(value: unknown): boolean {
  return value !== null && value !== "" && Number.isFinite(Number(value));
}

function parseServerError(raw: string, status?: number): string {
  const text = (raw || "").trim();
  const msg = text.toUpperCase();

  if (status === 401) return "Tu sesión ha expirado. Inicia sesión nuevamente.";
  if (status === 403) return "No tienes permisos para realizar esta acción.";
  if (status === 404) return "No se encontró el recurso solicitado.";

  if (msg.includes("SKU_DUPLICATE")) return "El SKU ya existe. Usa otro.";
  if (msg.includes("FIELD_REQUIRED:NOMBRE"))
    return "El campo 'Nombre' es obligatorio.";
  if (msg.includes("FIELD_REQUIRED:SKU"))
    return "El campo 'SKU' es obligatorio.";
  if (msg.includes("FIELD_REQUIRED:UNIDADALMACENAMIENTOID"))
    return "La 'Unidad de almacenamiento' es obligatoria.";
  if (msg.includes("UNIDAD_NOT_FOUND"))
    return "La unidad seleccionada no existe. Actualiza la lista y vuelve a intentar.";
  if (msg.includes("BODEGA_NOT_FOUND"))
    return "La bodega seleccionada no existe. Actualiza la lista y vuelve a intentar.";
  if (msg.includes("FAILED TO FETCH") || msg.includes("NETWORKERROR"))
    return "No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.";

  return text || "No se pudo registrar el producto.";
}

export function useProductoCreate() {
  const [values, setValues] = useState<ProductoCreate>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const setField = useCallback((name: keyof ProductoCreate, value: unknown) => {
    setValues((v) => ({ ...v, [name]: value as never }));
    setErrors((e) => {
      const copy = { ...e };
      delete copy[name as string];
      return copy;
    });
    setServerError(null);
  }, []);

  const validate = useCallback(() => {
    const e: Record<string, string> = {};

    if (!values.sku?.trim()) e.sku = "El SKU es obligatorio.";
    if (!values.nombre?.trim()) e.nombre = "El nombre es obligatorio.";

    if (values.unidadAlmacenamientoID == null) {
      e.unidadAlmacenamientoID = "La unidad es obligatoria.";
    } else if (!Number.isInteger(Number(values.unidadAlmacenamientoID)) || Number(values.unidadAlmacenamientoID) <= 0) {
      e.unidadAlmacenamientoID = "La unidad seleccionada no es válida.";
    }

    if (!isFiniteNumber(values.precioCosto)) {
      e.precioCosto = "El precio de costo es obligatorio.";
    } else if (Number(values.precioCosto) < 0) {
      e.precioCosto = "No puede ser negativo.";
    }

    if (!isFiniteNumber(values.precioVenta)) {
      e.precioVenta = "El precio de venta es obligatorio.";
    } else if (Number(values.precioVenta) < 0) {
      e.precioVenta = "No puede ser negativo.";
    }

    if (values.bodegaID != null) {
      if (!Number.isInteger(Number(values.bodegaID)) || Number(values.bodegaID) <= 0) {
        e.bodegaID = "La bodega seleccionada no es válida.";
      }
    }

    if (values.descuento != null) {
      if (!isFiniteNumber(values.descuento)) e.descuento = "Debe ser un número válido.";
      else if (Number(values.descuento) < 0 || Number(values.descuento) > 100)
        e.descuento = "Debe estar entre 0 y 100.";
    }

    const camposNoNegativos: Array<keyof ProductoCreate> = ["peso", "largo", "alto", "ancho"];
    camposNoNegativos.forEach((field) => {
      const value = values[field];
      if (value != null) {
        if (!isFiniteNumber(value)) {
          e[field] = "Debe ser un número válido.";
        } else if (Number(value) < 0) {
          e[field] = "No puede ser negativo.";
        }
      }
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [values]);

  const canSubmit = useMemo(() => !loading && !!API_BASE, [loading]);

  const reset = useCallback(() => {
    setValues(INITIAL_VALUES);
    setErrors({});
    setServerError(null);
  }, []);

  const submit = useCallback(async () => {
    setServerError(null);
    setSuccessId(null);

    if (!API_BASE) {
      setServerError("No está configurada la URL base del API.");
      return { ok: false as const, reason: "config" as const };
    }

    if (!validate()) {
      return { ok: false as const, reason: "validation" as const };
    }

    try {
      setLoading(true);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem(TOKEN_KEY)
          : null;

      const payload = {
        sku: values.sku.trim(),
        nombre: values.nombre.trim(),
        descripcion: values.descripcion?.trim() || null,
        codigoInterno: values.codigoInterno?.trim() || null,
        unidadAlmacenamientoID: values.unidadAlmacenamientoID ?? null,
        bodegaID: values.bodegaID ?? null,
        precioCosto: Number(values.precioCosto),
        precioVenta: Number(values.precioVenta),
        descuento: values.descuento != null ? Number(values.descuento) : null,
        peso: values.peso != null ? Number(values.peso) : null,
        largo: values.largo != null ? Number(values.largo) : null,
        alto: values.alto != null ? Number(values.alto) : null,
        ancho: values.ancho != null ? Number(values.ancho) : null,
      };

      const res = await fetch(`${API_BASE}/api/productos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        setServerError(parseServerError(text, res.status));
        return { ok: false as const, reason: "server" as const, status: res.status };
      }

      const json = (await res.json()) as ProductoCreateResult;
      const id = Number(json?.productoId);

      if (!Number.isFinite(id) || id <= 0) {
        setServerError("El producto se registró, pero la respuesta del servidor no fue válida.");
        return { ok: false as const, reason: "server" as const };
      }

      setSuccessId(id);
      reset();
      return { ok: true as const, id };
    } catch (err: any) {
      setServerError(parseServerError(err?.message));
      return { ok: false as const, reason: "network" as const };
    } finally {
      setLoading(false);
    }
  }, [reset, validate, values]);

  return {
    values,
    setField,
    errors,
    loading,
    canSubmit,
    submit,
    serverError,
    successId,
  };
}