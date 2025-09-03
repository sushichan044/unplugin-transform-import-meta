import path from "node:path";
import { describe, expect, it } from "vitest";

import type { ResolveRules } from "./options";

import { analyzeTypeScript } from "./analyze";
import { applyReplacements } from "./apply";

describe("analyzeTypeScript", () => {
  describe("no-op", () => {
    it("should not generate replacements when code does not include MetaProperty", () => {
      const code = "const foo = not_import.meta.foo;";
      const resolveRules: ResolveRules = {
        properties: { foo: true },
      };

      const result = analyzeTypeScript(code, resolveRules);
      expect(result.replacements).toHaveLength(0);
    });
  });

  describe("MemberExpression processing", () => {
    it("should transform simple property access", () => {
      const code = "const foo = import.meta.foo;";
      const resolveRules: ResolveRules = {
        properties: {
          foo: true,
        },
      };

      const result = analyzeTypeScript(code, resolveRules);
      expect(result.replacements).toHaveLength(1);
      const transformed = applyReplacements(code, result.replacements);

      expect(transformed).toMatchInlineSnapshot(`"const foo = true;"`);
    });

    it("should not transform unknown properties", () => {
      const code = "const unknown = import.meta.unknown;";
      const resolveRules: ResolveRules = {
        properties: {
          foo: true,
        },
      };

      const result = analyzeTypeScript(code, resolveRules);
      expect(result.replacements).toHaveLength(0);
    });

    it("should transform import.meta in function arguments", () => {
      const code = "console.log(import.meta.env);";
      const resolveRules: ResolveRules = {
        properties: {
          env: "production",
        },
      };

      const result = analyzeTypeScript(code, resolveRules);
      expect(result.replacements).toHaveLength(1);

      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(`"console.log("production");"`);
    });

    it("should handle nested property access", () => {
      const code = "const nested = import.meta.config.database.host;";
      const resolveRules: ResolveRules = {
        properties: {
          "config.database.host": "localhost",
        },
      };

      const result = analyzeTypeScript(code, resolveRules);
      expect(result.replacements).toHaveLength(1);

      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(
        `"const nested = "localhost";"`,
      );
    });

    it("should handle regular expressions", () => {
      const code = "const a = import.meta.a;";
      const resolveRules: ResolveRules = {
        properties: { a: /regex/ },
      };
      const result = analyzeTypeScript(code, resolveRules);
      expect(result.replacements).toHaveLength(1);

      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(`"const a = /regex/;"`);
    });
  });

  describe("CallExpression processing - method calls", () => {
    it("should transform method calls with literal arguments", () => {
      const code = "const resolvedPath = import.meta.resolve('./file');";
      const resolveRules: ResolveRules = {
        methods: {
          resolve: (p) => path.join("resolved", String(p)),
        },
      };

      const result = analyzeTypeScript(code, resolveRules);
      expect(result.replacements).toHaveLength(1);

      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(
        `"const resolvedPath = "resolved/file";"`,
      );
    });

    it("should handle nested method calls", () => {
      const code = "const resolvedPath = import.meta.utils.resolve('./test');";
      const resolveRules: ResolveRules = {
        methods: {
          "utils.resolve": (p) => path.join("resolved", String(p)),
        },
      };

      const result = analyzeTypeScript(code, resolveRules);
      expect(result.replacements).toHaveLength(1);

      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(
        `"const resolvedPath = "resolved/test";"`,
      );
    });

    it("should generate warnings for non-literal arguments", () => {
      const code = `
const variableArg = "./file.js";
const resolved = import.meta.resolve(variableArg);
const mixed = import.meta.glob("literal", someVar, 123);
      `.trim();

      const resolveRules: ResolveRules = {
        methods: {
          glob: (...args) => `globbed:${args.join(",")}`,
          resolve: (path) => `resolved:${String(path)}`,
        },
      };

      const result = analyzeTypeScript(code, resolveRules);

      expect(result.warnings).toMatchInlineSnapshot(`
        [
          {
            "end": 82,
            "message": "Method resolve called with non-literal arguments",
            "methodName": "resolve",
            "nonLiteralArgs": [
              {
                "index": 0,
                "type": "Identifier",
              },
            ],
            "start": 50,
          },
          {
            "end": 139,
            "message": "Method glob called with non-literal arguments",
            "methodName": "glob",
            "nonLiteralArgs": [
              {
                "index": 1,
                "type": "Identifier",
              },
            ],
            "start": 98,
          },
        ]
      `);

      // Should still create replacements despite warnings
      expect(result.replacements).toHaveLength(2);
    });

    it("should not transform unknown methods", () => {
      const code = "const result = import.meta.unknownMethod('./test');";
      const resolveRules: ResolveRules = {
        methods: {
          resolve: (path) => `resolved:${path}`,
        },
      };

      const result = analyzeTypeScript(code, resolveRules);

      expect(result.replacements).toHaveLength(0);
    });

    it("should handle non-MemberExpression callees", () => {
      const code = "const result = someFunction('./test');";
      const resolveRules: ResolveRules = {
        methods: {
          resolve: (path) => `resolved:${path}`,
        },
      };

      const result = analyzeTypeScript(code, resolveRules);

      expect(result).toMatchInlineSnapshot(`
        {
          "replacements": [],
          "warnings": [],
        }
      `);
    });
  });
});
