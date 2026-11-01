import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Port 3000 is allowed by the Last.fm function's CORS check.
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
  build: { outDir: "dist", sourcemap: false }
});
