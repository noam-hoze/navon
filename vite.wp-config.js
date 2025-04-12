// vite.wp-config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name in an ES module context
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [react()],
    base: "./", // Important for WordPress relative paths
    build: {
        outDir: "dist",
        assetsDir: "assets",
        emptyOutDir: true,
        sourcemap: true, // Can be false for production if needed
        rollupOptions: {
            input: {
                // Use path.resolve with the derived __dirname
                index: path.resolve(__dirname, "src/wp-main.jsx"),
            },
            output: {
                // Consistent naming for WP enqueueing
                entryFileNames: "assets/index.js",
                chunkFileNames: "assets/index.js", // Keep chunks consistent if any
                assetFileNames: "assets/[name].[ext]",
            },
        },
    },
});
