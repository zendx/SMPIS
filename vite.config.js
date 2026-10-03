import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: process.env.VERCEL ? "public" : "dist",
    emptyOutDir: true,
    copyPublicDir: false,
  },
  server: { host: "127.0.0.1" },
});
