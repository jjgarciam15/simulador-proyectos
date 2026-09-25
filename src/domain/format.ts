/**
 * Precision policy (single source for new screens):
 * - Money: millions of COP (M), no decimals, thousands separator «.» (es-CO).
 * - Rates and percentages: one decimal.
 * - RPC: three decimals (as published by DNP).
 * - Discount factors: four decimals.
 * - Quantities: no decimals when ≥ 100, two otherwise.
 * Calculations are never rounded; only the display is.
 */
const nf = (d: number) => new Intl.NumberFormat("es-CO", { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtMoney = (v: number) => nf(0).format(Math.round(v)) + " M";
export const fmtSignedMoney = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "") + nf(0).format(Math.abs(Math.round(v))) + " M";
export const fmtPct = (v: number) => nf(1).format(v * 100) + " %";
export const fmtRpc = (v: number) => nf(3).format(v);
export const fmtFactor = (v: number) => nf(4).format(v);
export const fmtQty = (v: number) => nf(Math.abs(v) >= 100 ? 0 : 2).format(v);
/** Unit values can be small (e.g. 1,03 M per case): two decimals below 100. */
export const fmtUnitMoney = (v: number) => (Math.abs(v) >= 100 ? fmtMoney(v) : nf(2).format(v) + " M");
