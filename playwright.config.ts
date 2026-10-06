import { defineConfig, devices } from "@playwright/test";

/** Pruebas de extremo a extremo sobre el build de producción (pnpm build antes de pnpm e2e). */
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 60_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4174",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 1000 },
    contextOptions: { reducedMotion: "reduce" },
  },
  webServer: {
    command: "pnpm exec vite preview --host 127.0.0.1 --port 4174 --strictPort",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
