import path from "node:path";
import { describe, expect, it } from "vitest";

import type { ImportMetaBindings } from "./types";

import { analyzeTypeScript } from "./analyze";
import { applyReplacements } from "./utils";

describe("analyzeTypeScript", () => {
  describe("no-op", () => {
    it("should not generate replacements when code does not include MetaProperty", () => {
      const code = "const foo = not_import.meta.foo;";
      const ImportMetaBindings: ImportMetaBindings = {
        functions: {},
        values: { foo: true },
      };

      const result = analyzeTypeScript(code, ImportMetaBindings);
      expect(result.replacements).toHaveLength(0);
    });
  });

  describe("MemberExpression processing", () => {
    it("should transform simple property access", () => {
      const code = "const foo = import.meta.foo;";
      const ImportMetaBindings: ImportMetaBindings = {
        functions: {},
        values: {
          foo: true,
        },
      };

      const result = analyzeTypeScript(code, ImportMetaBindings);
      expect(result.replacements).toHaveLength(1);
      const transformed = applyReplacements(code, result.replacements);

      expect(transformed).toMatchInlineSnapshot(`"const foo = true;"`);
    });

    it("should not transform unknown properties", () => {
      const code = "const unknown = import.meta.unknown;";
      const ImportMetaBindings: ImportMetaBindings = {
        functions: {},
        values: {
          foo: true,
        },
      };

      const result = analyzeTypeScript(code, ImportMetaBindings);
      expect(result.replacements).toHaveLength(0);
    });

    it("should transform import.meta in function arguments", () => {
      const code = "console.log(import.meta.env);";
      const ImportMetaBindings: ImportMetaBindings = {
        functions: {},
        values: {
          env: "production",
        },
      };

      const result = analyzeTypeScript(code, ImportMetaBindings);
      expect(result.replacements).toHaveLength(1);

      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(`"console.log("production");"`);
    });

    it("should handle nested property access", () => {
      const code = "const nested = import.meta.config.database.host;";
      const ImportMetaBindings: ImportMetaBindings = {
        functions: {},
        values: {
          "config.database.host": "localhost",
        },
      };

      const result = analyzeTypeScript(code, ImportMetaBindings);
      expect(result.replacements).toHaveLength(1);

      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(
        `"const nested = "localhost";"`,
      );
    });

    it("should handle regular expressions", () => {
      const code = "const a = import.meta.a;";
      const ImportMetaBindings: ImportMetaBindings = {
        functions: {},
        values: { a: /regex/ },
      };
      const result = analyzeTypeScript(code, ImportMetaBindings);
      expect(result.replacements).toHaveLength(1);

      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(`"const a = /regex/;"`);
    });
  });

  describe("CallExpression processing - method calls", () => {
    it("should transform method calls with literal arguments", () => {
      const code = "const resolvedPath = import.meta.resolve('./file');";
      const ImportMetaBindings: ImportMetaBindings = {
        functions: {
          resolve: (p: bigint | boolean | number | string | RegExp | null) =>
            path.join("resolved", String(p)),
        },
        values: {},
      };

      const result = analyzeTypeScript(code, ImportMetaBindings);
      expect(result.replacements).toHaveLength(1);

      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(
        `"const resolvedPath = "resolved/file";"`,
      );
    });

    it("should handle nested method calls", () => {
      const code = "const resolvedPath = import.meta.utils.resolve('./test');";
      const ImportMetaBindings: ImportMetaBindings = {
        functions: {
          "utils.resolve": (
            p: bigint | boolean | number | string | RegExp | null,
          ) => path.join("resolved", String(p)),
        },
        values: {},
      };

      const result = analyzeTypeScript(code, ImportMetaBindings);
      expect(result.replacements).toHaveLength(1);

      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(
        `"const resolvedPath = "resolved/test";"`,
      );
    });

    it("should handle literal-only TemplateLiterals", () => {
      const code = "const resolvedPath = import.meta.resolve(`./file-raw`);";
      const ImportMetaBindings: ImportMetaBindings = {
        functions: {
          resolve: (p: bigint | boolean | number | string | RegExp | null) =>
            path.join("resolved", String(p)),
        },
        values: {},
      };

      const result = analyzeTypeScript(code, ImportMetaBindings);
      expect(result.replacements).toHaveLength(1);

      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(
        `"const resolvedPath = "resolved/file-raw";"`,
      );
    });

    it("should generate errors for non-literal arguments", () => {
      const code = `
const variableArg = "./file.js";
const resolved = import.meta.resolve(variableArg);
const mixed = import.meta.glob("literal", someVar, 123);
      `.trim();

      const ImportMetaBindings: ImportMetaBindings = {
        functions: {
          glob: (
            ...args: Array<bigint | boolean | number | string | RegExp | null>
          ) => `globbed:${args.join(",")}`,
          resolve: (
            pathArg: bigint | boolean | number | string | RegExp | null,
          ) => `resolved:${String(pathArg)}`,
        },
        values: {},
      };

      const result = analyzeTypeScript(code, ImportMetaBindings);

      expect(result.errors).toMatchInlineSnapshot(`
        [
          {
            "end": 81,
            "message": "Argument at index 0 of method import.meta.resolve() is not a literal",
            "meta": {
              "argumentIndex": 0,
              "argumentType": "Identifier",
            },
            "start": 70,
          },
          {
            "end": 133,
            "message": "Argument at index 1 of method import.meta.glob() is not a literal",
            "meta": {
              "argumentIndex": 1,
              "argumentType": "Identifier",
            },
            "start": 126,
          },
        ]
      `);

      expect(result.replacements).toHaveLength(0);
    });

    it("should not transform unknown methods", () => {
      const code = "const result = import.meta.unknownMethod('./test');";
      const ImportMetaBindings: ImportMetaBindings = {
        functions: {
          resolve: (path: bigint | boolean | number | string | RegExp | null) =>
            `resolved:${path}`,
        },
        values: {},
      };

      const result = analyzeTypeScript(code, ImportMetaBindings);

      expect(result.replacements).toHaveLength(0);
    });

    it("should handle non-MemberExpression callees", () => {
      const code = "const result = someFunction('./test');";
      const ImportMetaBindings: ImportMetaBindings = {
        functions: {
          resolve: (path: bigint | boolean | number | string | RegExp | null) =>
            `resolved:${path}`,
        },
        values: {},
      };

      const result = analyzeTypeScript(code, ImportMetaBindings);

      expect(result).toMatchInlineSnapshot(`
        {
          "errors": [],
          "replacements": [],
        }
      `);
    });
  });
});
