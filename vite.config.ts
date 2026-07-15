import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Viem dynamically imports its CCIP error helper after any failed RPC
        // request. Keep it in the main bundle so a stale chunk can never mask
        // the underlying contract/RPC error.
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
