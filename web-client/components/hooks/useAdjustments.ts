import { useApi } from "./useApi";

export type AjusteDto = {
  ProductoID: number;
  BodegaID: number;
  TipoMovimiento: "Entrada" | "Salida" | "AjustePositivo" | "AjusteNegativo";
  Cantidad: number;
  Motivo?: string | null;
};

export function useAdjustments() {
  const { call, loading, error } = useApi();

  async function apply(dto: AjusteDto) {
    return call<{ message: string }>(`/api/inventario/ajuste`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  }

  return { apply, loading, error };
}
