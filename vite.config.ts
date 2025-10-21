import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src/**/*"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "stories/**/*"],
      outDir: "types",
      copyDtsFiles: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "AntflyComponents",
      formats: ["es", "umd"],
      fileName: (format) => `main.${format === "es" ? "js" : "umd.cjs"}`,
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        // Provide global variables for UMD build
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
        },
      },
    },
    sourcemap: true,
    outDir: "dist",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
