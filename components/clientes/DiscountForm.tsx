import React from "react";
import Field from "../Inputs/fields";
import { Cliente } from "./types";
import Button from "../buttons/button";

const DiscountForm = ({
  cliente,
  onCancel,
  onSave,
}: {
  cliente: Cliente;
  onCancel: () => void;
  onSave: (value: number) => void;
}) => {
  const [value, setValue] = React.useState<number>(cliente.descuento ?? 0);
  const [error, setError] = React.useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number.isNaN(value) || value < 0 || value > 100) {
      return setError("El descuento debe estar entre 0% y 100%.");
    }
    onSave(Math.round(value));
  };

  return (
    <form onSubmit={submit} className="w-full max-w-2xl">
      <div className="mb-1 text-sm text-secondary/70">
        Cliente: <b className="text-secondary">{cliente.nombre}</b>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary">Administrar descuento</h2>
        <Button variant="primary" type="button" onClick={onCancel}>
          Cerrar
        </Button>
      </div>

      {error && (
        <div className="mb-3 rounded-md bg-danger px-4 py-2 text-sm text-white">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Porcentaje (%)">
          <input
            type="number"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="border-b-2"
          />
        </Field>
        <Field label="Notas (opcional)">
          <input placeholder="Escriba aca sus notas..." className="input" />
        </Field>
      </div>

      <p className="mt-1 text-xs text-secondary/60">
        Este valor aplica de forma general al cliente
      </p>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit">
          Guardar descuento
        </Button>
      </div>
    </form>
  );
}

export default DiscountForm;