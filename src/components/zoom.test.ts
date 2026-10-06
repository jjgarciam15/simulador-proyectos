import { describe, it, expect } from "vitest";
import { autoZoom, clampZoom, effectiveZoom, maxZoomFor, readZoom, stepZoom, zoomLabel, zoomMax, zoomMin } from "./zoom";

describe("Zoom de la interfaz", () => {
  it("el modo automático se adapta al ancho de la ventana", () => {
    expect(autoZoom(390)).toBe(1); // teléfono: el diseño móvil ya se adapta
    expect(autoZoom(1366)).toBe(0.95);
    expect(autoZoom(1440)).toBe(1);
    expect(autoZoom(1920)).toBe(1.35);
    expect(autoZoom(1024)).toBe(0.75);
    expect(autoZoom(3840)).toBe(1.35);
    expect(autoZoom(NaN)).toBe(1);
  });
  it("los pasos manuales avanzan de 10 en 10 % dentro de los límites", () => {
    expect(stepZoom(1, 1)).toBe(1.1);
    expect(stepZoom(0.95, -1)).toBe(0.9);
    expect(stepZoom(0.95, 1)).toBe(1);
    expect(stepZoom(zoomMax, 1)).toBe(zoomMax);
    expect(stepZoom(zoomMin, -1)).toBe(zoomMin);
    expect(clampZoom(7)).toBe(zoomMax);
    expect(clampZoom(Infinity)).toBe(1);
  });
  it("la preferencia guardada se valida y el texto se muestra en porcentaje", () => {
    expect(readZoom(undefined)).toBe("auto");
    expect(readZoom("grande")).toBe("auto");
    expect(readZoom(1.23)).toBe(1.25);
    expect(effectiveZoom("auto", 1440)).toBe(1);
    expect(effectiveZoom(0.8, 1920)).toBe(0.8);
    expect(zoomLabel(1.1)).toBe("110 %");
  });
  it("en un teléfono el zoom máximo deja al menos 320 px de contenido", () => {
    expect(maxZoomFor(390)).toBe(1.2);
    expect(maxZoomFor(320)).toBe(1);
    expect(maxZoomFor(1366)).toBe(zoomMax);
    expect(effectiveZoom(1.6, 390)).toBe(1.2);
    expect(390 / effectiveZoom(1.6, 390)).toBeGreaterThanOrEqual(320);
  });
});
