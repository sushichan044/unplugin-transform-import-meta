// @ts-check

import ts from "@virtual-live-lab/eslint-config/presets/ts";
import importAccess from "eslint-plugin-import-access/flat-config";
import { defineConfig } from "eslint/config";

export default defineConfig(
  ts,
  {
    name: "@repo/eslint-config/import-access/plugin",
    plugins: {
      // @ts-expect-error type mismatch between ESLint and typescript-eslint
      "import-access": importAccess,
    },
  },
  {
    files: ["**/*.ts"],
    name: "@repo/eslint-config/import-access/rules",
    rules: {
      "import-access/jsdoc": "error",
    },
  },
  {
    name: "@repo/eslint-config/allow-unnecessary-assertion-in-plugin-exports/rules",
    files: ["src/*.ts"],
    rules: {
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
    },
  },
  {
    name: "@repo/eslint-config/forbidden-unnecessary-assertion-in-plugin-api/rules",
    files: ["src/api.ts"],
    rules: {
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
    },
  },
);
