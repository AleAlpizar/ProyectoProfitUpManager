"use client";

import React from "react";
import Modal from "../modals/Modal";
import Button from "../buttons/button";
import { ProviderViewModel } from "./ViewProvider";
import { ProveedorUpdateInput, updateProvider } from "./providers.api";
import { useSession } from "../hooks/useSession";
import { useConfirm } from "../modals/ConfirmProvider";

type Props = {
  provider: ProviderViewModel;
  onSaved?: () => void;
  onClose: () => void;
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: React.HTMLInputTypeAttribute;
}> = ({ label, value, onChange, type = "text" }) => (
  <label className="space-y-1">
    <span className="text-xs text-[#8B9AA0]">{label}</span>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="w-full rounded-2xl border border-white/10 bg-[#0F1315] px-3 py-2.5 text-sm outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-[#8B9AA0] transition focus:border-transparent focus:ring-2 focus:ring-[#A30862]/40"
    />
  </label>
);

const EditProvider: React.FC<Props> = ({ provider, onSaved, onClose }) => {
  const { authHeader } = useSession();
  const confirm = useConfirm();

  const [form, setForm] = React.useState({
    nombre: provider.nombre ?? "",
    contacto: provider.contacto ?? "",
    telefono: provider.telefono ?? "",
    correo: provider.correo ?? "",
    direccion: provider.direccion ?? "",
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onChange =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
    };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    const ok = await confirm({
      title: "Guardar cambios",
      message: (
        <>
          ¿Deseas guardar los cambios del proveedor <b>{form.nombre}</b>?
        </>
      ),
      tone: "brand",
      confirmText: "Sí, guardar",
      cancelText: "Cancelar",
    });
    if (!ok) return;

    try {
      setLoading(true);

      const payload: ProveedorUpdateInput = {
        nombre: form.nombre.trim(),
        contacto: form.contacto.trim() || null,
        telefono: form.telefono.trim() || null,
        correo: form.correo.trim() || null,
        direccion: form.direccion.trim() || null,
      };

      await updateProvider(provider.proveedorId, payload, authHeader as any);

      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || "No se pudo actualizar el proveedor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal frameless onClose={onClose}>
      <form
        onSubmit={submit}
        className="w-full max-w-4xl rounded-3xl border border-white/10 bg-[#13171A] text-[#E6E9EA] shadow-[0_30px_80px_rgba(0,0,0,.55)] ring-1 ring-black/20"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-[#8B9AA0]">
              Proveedores
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-wide">
              Editar proveedor
            </h2>
            <p className="mt-1 text-sm text-[#8B9AA0]">
              Actualiza los datos del proveedor.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#8B9AA0] hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="mx-6 my-4 h-px bg-white/10" />

        {error && (
          <div className="mx-6 mb-4 rounded-2xl border border-[#6C0F1C]/40 bg-[#6C0F1C]/15 px-4 py-3 text-sm text-[#F7C6CF]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 px-6 pb-2 md:grid-cols-2">
          <Field
            label="Nombre"
            value={form.nombre}
            onChange={onChange("nombre")}
          />
          <Field
            label="Contacto"
            value={form.contacto}
            onChange={onChange("contacto")}
          />
          <Field
            label="Teléfono"
            value={form.telefono}
            onChange={onChange("telefono")}
          />
          <Field
            label="Correo"
            value={form.correo}
            onChange={onChange("correo")}
            type="email"
          />
          <Field
            label="Dirección"
            value={form.direccion}
            onChange={onChange("direccion")}
          />
        </div>

        <div className="mx-6 my-6 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="!rounded-2xl !border-white/20 !bg-transparent !text-[#E6E9EA] hover:!bg-white/5 focus:!ring-2 focus:!ring-[#A30862]/40"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="!rounded-2xl !bg-[#A30862] !text-white"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProvider;
