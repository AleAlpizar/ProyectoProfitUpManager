export const formatMoney = (n: number) => {
  return n.toLocaleString("es-CR", { style: "currency", currency: "CRC" })
    // Si prefieres USD, cambia currency: "USD"
    .replace("CRC", "₡"); // opcional
}

