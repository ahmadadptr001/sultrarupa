import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored, minified runtime bundles are preserved as assets. Lint the
    // Sultra modules that sit beside them, not the upstream distribution.
    "public/assets/main.*.js",
    "public/assets/vendor.*.js",
    "public/assets/webgl.*.js",
    "public/vendors/**",
  ]),
]);

export default eslintConfig;
