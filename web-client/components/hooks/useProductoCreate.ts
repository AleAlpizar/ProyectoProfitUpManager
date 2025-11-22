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

function parseServerError(raw: string): string {
  const msg = (raw || "").toUpperCase();
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
    return "La bodega seleccionada no existe.";
  return raw || "No se pudo registrar el producto.";
}

export function useProductoCreate() {
  const [values, setValues] = useState<ProductoCreate>({
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const setField = useCallback(
    (name: keyof ProductoCreate, value: any) => {
      setValues((v) => ({ ...v, [name]: value }));
      setErrors((e) => {
        const copy = { ...e };
        delete copy[name as string];
        return copy;
      });
    },
    []
  );

  const validate = useCallback(() => {
    const e: Record<string, string> = {};

    if (!values.sku?.trim()) e.sku = "Requerido";
    if (!values.nombre?.trim()) e.nombre = "Requerido";
    if (values.unidadAlmacenamientoID == null)
      e.unidadAlmacenamientoID = "Requerido";

    if (values.precioCosto == null || isNaN(Number(values.precioCosto)))
      e.precioCosto = "Requerido";
    if (values.precioVenta == null || isNaN(Number(values.precioVenta)))
      e.precioVenta = "Requerido";

    if (values.precioCosto != null && Number(values.precioCosto) < 0)
      e.precioCosto = "No puede ser negativo";
    if (values.precioVenta != null && Number(values.precioVenta) < 0)
      e.precioVenta = "No puede ser negativo";

    if (values.descuento != null) {
      if (isNaN(Number(values.descuento))) e.descuento = "Debe ser un número";
      else if (values.descuento < 0 || values.descuento > 100)
        e.descuento = "Debe estar entre 0 y 100";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [values]);

  const canSubmit = useMemo(() => !loading, [loading]);

  const reset = useCallback(() => {
    setValues({
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
    });
    setErrors({});
    setServerError(null);
  }, []);

  const submit = useCallback(async () => {
    setServerError(null);
    setSuccessId(null);

    if (!validate()) return { ok: false, reason: "validation" as const };

    try {
      setLoading(true);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem(TOKEN_KEY)
          : null;

      const res = await fetch(`${API_BASE}/api/productos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sku: values.sku.trim(),
          nombre: values.nombre.trim(),
          descripcion: values.descripcion?.trim() || null,
          codigoInterno: values.codigoInterno?.trim() || null,
          unidadAlmacenamientoID: values.unidadAlmacenamientoID ?? null,
          bodegaID: values.bodegaID ?? null,
          precioCosto: Number(values.precioCosto),
          precioVenta: Number(values.precioVenta),
          descuento:
            values.descuento != null ? Number(values.descuento) : null,
          peso: values.peso != null ? Number(values.peso) : null,
          largo: values.largo != null ? Number(values.largo) : null,
          alto: values.alto != null ? Number(values.alto) : null,
          ancho: values.ancho != null ? Number(values.ancho) : null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        setServerError(parseServerError(text));
        return { ok: false, reason: "server" as const, status: res.status };
      }

      const json = (await res.json()) as ProductoCreateResult;
      const id = json.productoId;

      setSuccessId(id);
      reset();
      return { ok: true as const, id };
    } catch (err: any) {
      setServerError(parseServerError(err?.message));
      return { ok: false, reason: "network" as const };
    } finally {
      setLoading(false);
    }
  }, [validate, values, reset]);

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
