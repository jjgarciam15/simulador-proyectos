/**
 * Interface zoom: scales the whole simulator (CSS zoom on the root) so it fits the screen.
 * "auto" adapts to the window width; a number is a fixed level chosen by the player.
 * It is a per-browser preference, never part of the game state or the score.
 */
export type ZoomSetting = "auto" | number;
export const zoomMin = 0.6,
  zoomMax = 1.6,
  zoomStep = 0.1;
/** Design width of the desktop layout: at this width the automatic zoom is 100 %. */
export const designWidth = 1440;
const round = (v: number, step: number) => Math.round(v / step) * step;
export function clampZoom(v: number) {
  if (!Number.isFinite(v)) return 1;
  return Math.min(zoomMax, Math.max(zoomMin, Number(round(v, 0.05).toFixed(2))));
}
/**
 * Automatic level for a window width. Phones and tablets (< 900 px) keep 100 % because
 * the mobile layout already adapts; laptops shrink to fit (down to 75 %); large monitors grow (up to 135 %).
 */
export function autoZoom(width: number) {
  if (!Number.isFinite(width) || width < 900) return 1;
  return Math.min(1.35, Math.max(0.75, Number(round(width / designWidth, 0.05).toFixed(2))));
}
/** Narrowest content width the layouts support: on a phone, zooming in further would overflow the screen. */
export const minLayoutWidth = 320;
/** Highest zoom for a window width (phones: 390 px → 120 %; tablets and computers: 160 %). */
export function maxZoomFor(width: number) {
  if (!Number.isFinite(width) || width >= 900) return zoomMax;
  return Math.max(1, Math.min(zoomMax, Math.floor((width / minLayoutWidth) * 20 + 1e-6) / 20));
}
export function effectiveZoom(setting: ZoomSetting, width: number) {
  return setting === "auto" ? autoZoom(width) : Math.min(clampZoom(setting), maxZoomFor(width));
}
/** Next multiple of 10 % above or below the level currently shown (leaves automatic mode): 95 % → 100 % or 90 %. */
export function stepZoom(current: number, direction: 1 | -1) {
  const units = current / zoomStep,
    next = direction > 0 ? Math.floor(units + 1e-6) + 1 : Math.ceil(units - 1e-6) - 1;
  return clampZoom(next * zoomStep);
}
export function readZoom(value: unknown): ZoomSetting {
  return typeof value === "number" && Number.isFinite(value) ? clampZoom(value) : "auto";
}
export const zoomLabel = (v: number) => `${Math.round(v * 100)} %`;
