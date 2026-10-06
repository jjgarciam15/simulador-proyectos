import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // pdf.js is imported on demand (PDF import only): keep it out of the startup bundle.
          if (id.includes("node_modules/pdfjs-dist")) return undefined;
          if (id.includes("node_modules"))
            return /recharts|d3-|victory|internmap|decimal/.test(id)
              ? "charts"
              : "vendor";
        },
      },
    },
  },
});
