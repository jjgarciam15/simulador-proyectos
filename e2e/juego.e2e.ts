import { test, expect, type Page } from "@playwright/test";

/** Every test starts from an empty QA save slot and fails on any page or console error. */
async function fresh(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !m.text().includes("Failed to load resource") && errors.push(m.text()));
  await page.goto("/?qa=1");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  return errors;
}
async function startMission(page: Page) {
  await page.getByRole("button", { name: /Comenzar reconstrucción/ }).click();
  await page.getByRole("button", { name: /Entrar a la simulación/ }).click();
  await page.getByRole("button", { name: /Recibir el encargo/ }).click();
  await expect(page.locator(".page-heading .eyebrow")).toContainText("ETAPA 01");
}

test("una misión nueva arranca en Diagnóstico sin errores", async ({ page }) => {
  const errors = await fresh(page);
  await startMission(page);
  await expect(page.locator(".phase-strip")).toBeVisible();
  expect(errors).toEqual([]);
});

test("el Árbol del problema se construye con tarjetas y bloquea el avance hasta confirmarlo", async ({ page }) => {
  const errors = await fresh(page);
  await startMission(page);
  await page.locator(".section-nav button", { hasText: /rbol del problema/ }).first().click();
  const panel = page.locator("section.panel", { hasText: "Construye el Árbol del problema" });
  const bank = panel.locator(".ptb-bank .ptb-card");
  await expect(bank).toHaveCount(14);
  await page.getByRole("button", { name: /Guardar y avanzar/ }).click();
  await expect(page.getByRole("alert").first()).toContainText("Árbol del problema");
  await page.keyboard.press("Escape");
  // One card as the central problem, the rest out of the tree: valid structure, low score.
  await bank.first().locator("select").selectOption("central");
  while ((await bank.count()) > 0) await bank.first().locator("select").selectOption("fuera");
  await panel.getByRole("button", { name: "Confirmar Árbol del problema" }).click();
  await expect(panel.locator(".findings")).toContainText("Construcción del árbol");
  expect(errors).toEqual([]);
});

test("el Centro de aprendizaje ofrece 5 opciones por ejercicio", async ({ page }) => {
  const errors = await fresh(page);
  await page.getByRole("button", { name: /^Aprender$/ }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const groups = dialog.locator(".v22-experiment .v22-choice");
  await expect(groups.first()).toBeVisible();
  for (const g of await groups.all()) await expect(g.locator('input[type="radio"]')).toHaveCount(5);
  expect(errors).toEqual([]);
});

test("ninguna pregunta visible de una etapa tiene más de 5 opciones", async ({ page }) => {
  const errors = await fresh(page);
  await startMission(page);
  const counts = await page.evaluate(() => {
    const names = new Map<string, number>();
    for (const r of document.querySelectorAll<HTMLInputElement>('main input[type="radio"]')) names.set(r.name, (names.get(r.name) ?? 0) + 1);
    return [...names.values()];
  });
  expect(counts.every((n) => n <= 5)).toBe(true);
  expect(errors).toEqual([]);
});

test("el zoom acerca y aleja toda la interfaz, se guarda y vuelve al ajuste automático", async ({ page }) => {
  const errors = await fresh(page);
  const zoom = () => page.evaluate(() => getComputedStyle(document.documentElement).zoom);
  await expect(page.locator(".zoom-level")).toContainText("100 %");
  await page.getByRole("button", { name: /Acercar/ }).click();
  expect(await zoom()).toBe("1.1");
  await startMission(page);
  await page.getByRole("button", { name: /Alejar/ }).click();
  await page.getByRole("button", { name: /Alejar/ }).click();
  expect(await zoom()).toBe("0.9");
  await page.reload();
  expect(await zoom()).toBe("0.9");
  await page.getByRole("button", { name: /Volver al ajuste automático/ }).click();
  expect(await zoom()).toBe("1");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test("el menú de etapas se oculta y se muestra durante la partida y amplía el área de trabajo", async ({ page }) => {
  const errors = await fresh(page);
  await startMission(page);
  const main = () => page.locator(".game-main").evaluate((e) => e.getBoundingClientRect().width);
  const before = await main();
  await page.getByRole("button", { name: "Ocultar el menú de etapas" }).click();
  await expect(page.locator(".sidebar")).toBeHidden();
  expect(await main()).toBeGreaterThan(before);
  await page.reload();
  await page.getByText("Continuar misión").first().click();
  await expect(page.getByRole("button", { name: "Mostrar el menú de etapas" })).toBeVisible();
  await page.getByRole("button", { name: "Mostrar el menú de etapas" }).click();
  await expect(page.locator(".sidebar")).toBeVisible();
  expect(errors).toEqual([]);
});

test("el modo presentación muestra una partida resuelta, recorre las 8 etapas y no modifica las partidas guardadas", async ({ page }) => {
  const errors = await fresh(page);
  const before = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).filter(([k]) => k.startsWith("proyecta-qa"))));
  await page.getByRole("button", { name: /Modo presentación/ }).click();
  await expect(page.locator(".presentation-bar")).toContainText("solo lectura");
  for (let i = 1; i <= 8; i++) {
    await expect(page.locator(".page-heading .eyebrow")).toContainText(`ETAPA 0${i} DE 08`);
    if (i < 8) await page.getByRole("button", { name: /Etapa siguiente/ }).click();
  }
  await page.locator(".section-nav button", { hasText: /Por qué obtuviste esta nota/ }).first().click();
  await expect(page.locator(".score-breakdown")).toBeVisible();
  await page.getByRole("tab", { name: "1", exact: true }).click();
  await page.locator(".section-nav button", { hasText: /rbol del problema/ }).first().click();
  await page.getByRole("button", { name: "Confirmar Árbol del problema" }).click({ force: true });
  await expect(page.getByRole("alert").first()).toContainText("Modo presentación");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Salir de la presentación/ }).click();
  const after = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).filter(([k]) => k.startsWith("proyecta-qa"))));
  expect(after).toBe(before);
  expect(errors).toEqual([]);
});
