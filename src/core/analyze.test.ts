import path from "node:path";
import { describe, expect, it } from "vitest";

import type { UserImportMetaBindings } from "./types";

import { analyzeTypeScript } from "./analyze";
import { normalizeBindings } from "./options";
import { applyReplacements } from "./utils";

function createBindings(input: UserImportMetaBindings) {
  return normalizeBindings(input);
}

describe("analyzeTypeScript", () => {
  describe("no-op", () => {
    it("should not generate replacements when code does not include MetaProperty", () => {
      const code = "const foo = not_import.meta.foo;";
      const result = analyzeTypeScript(
        code,
        createBindings({
          define: { foo: true },
        }),
      );
      expect(result.replacements).toHaveLength(0);
    });
  });

  describe("MemberExpression processing", () => {
    it("should transform simple property access", () => {
      const code = "const foo = import.meta.foo;";
      const result = analyzeTypeScript(
        code,
        createBindings({
          define: {
            foo: true,
          },
        }),
      );
      expect(result.replacements).toHaveLength(1);
      const transformed = applyReplacements(code, result.replacements);

      expect(transformed).toMatchInlineSnapshot(`"const foo = true;"`);
    });

    it("should not transform unknown properties", () => {
      const code = "const unknown = import.meta.unknown;";
      const result = analyzeTypeScript(
        code,
        createBindings({
          define: {
            foo: true,
          },
        }),
      );
      expect(result.replacements).toHaveLength(0);
    });

    it("should transform import.meta in function arguments", () => {
      const code = "console.log(import.meta.env);";
      const result = analyzeTypeScript(
        code,
        createBindings({
          define: {
            env: "production",
          },
        }),
      );
      expect(result.replacements).toHaveLength(1);

      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(`"console.log("production");"`);
    });

    it("should handle nested property access", () => {
      const code = "const nested = import.meta.config.database.host;";
      const result = analyzeTypeScript(
        code,
        createBindings({
          define: {
            "config.database.host": "localhost",
          },
        }),
      );
      expect(result.replacements).toHaveLength(1);

      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(
        `"const nested = "localhost";"`,
      );
    });

    it("should handle regular expressions", () => {
      const code = "const a = import.meta.a;";
      const result = analyzeTypeScript(
        code,
        createBindings({
          define: { a: /regex/ },
        }),
      );
      expect(result.replacements).toHaveLength(1);

      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(`"const a = /regex/;"`);
    });

    it("should reject object define values with non-identifier keys", () => {
      expect(() =>
        createBindings({
          define: {
            modules: {
              "./dir/bar.js": () => "bar",
              "./dir/foo.js": async () => Promise.resolve("foo"),
            },
          },
        }),
      ).toThrow(AggregateError);
    });

    it("should inline zero-argument function define values", () => {
      const code = "const factory = import.meta.factory;";
      const result = analyzeTypeScript(
        code,
        createBindings({
          define: {
            factory: () => ({ message: "ok" }),
          },
        }),
      );

      expect(result.replacements).toHaveLength(1);
      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(
        '"const factory = (/*#__PURE__*/(() => ({ message: \"ok\" })));"',
      );
    });
  });

  describe("CallExpression processing - method calls", () => {
    it("should transform method calls with literal arguments", () => {
      const code = "const resolvedPath = import.meta.resolve('./file');";
      const result = analyzeTypeScript(
        code,
        createBindings({
          build: {
            resolve: (p: bigint | boolean | number | string | RegExp | null) =>
              path.join("resolved", String(p)),
          },
        }),
      );
      expect(result.replacements).toHaveLength(1);

      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(
        `"const resolvedPath = "resolved/file";"`,
      );
    });

    it("should handle nested method calls", () => {
      const code = "const resolvedPath = import.meta.utils.resolve('./test');";
      const result = analyzeTypeScript(
        code,
        createBindings({
          build: {
            "utils.resolve": (
              p: bigint | boolean | number | string | RegExp | null,
            ) => path.join("resolved", String(p)),
          },
        }),
      );
      expect(result.replacements).toHaveLength(1);

      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(
        `"const resolvedPath = "resolved/test";"`,
      );
    });

    // TODO: remove todo if template literal handling is implemented
    it.todo("should handle literal-only TemplateLiterals", () => {
      const code = "const resolvedPath = import.meta.resolve(`./file-raw`);";
      const result = analyzeTypeScript(
        code,
        createBindings({
          build: {
            resolve: (p: bigint | boolean | number | string | RegExp | null) =>
              path.join("resolved", String(p)),
          },
        }),
      );
      expect(result.replacements).toHaveLength(1);

      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toMatchInlineSnapshot(
        `"const resolvedPath = "resolved/file-raw";"`,
      );
    });

    it("should inline build results returning complex structures", () => {
      const code = "const data = import.meta.load('./file');";
      const result = analyzeTypeScript(
        code,
        createBindings({
          build: {
            load: (id) => ({
              id,
              meta: { cached: true },
              modules: ["a", "b"],
            }),
          },
        }),
      );

      expect(result.replacements).toHaveLength(1);
      const transformed = applyReplacements(code, result.replacements);
      expect(transformed).toBe(
        'const data = { id: "./file", meta: { cached: true }, modules: ["a", "b"] };',
      );
    });

    it("should report when build result is not serializable", () => {
      const code = "const data = import.meta.load('./file');";
      const result = analyzeTypeScript(
        code,
        createBindings({
          build: {
            // @ts-expect-error runtime validation
            load: () => new Date(),
          },
        }),
      );

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain(
        "Return value of import.meta.load() is not serializable",
      );
      expect(result.replacements).toHaveLength(0);
    });

    it("should generate errors for non-literal arguments", () => {
      const code = `
const variableArg = "./file.js";
const resolved = import.meta.resolve(variableArg);
const mixed = import.meta.glob("literal", someVar, 123);
      `.trim();

      const result = analyzeTypeScript(
        code,
        createBindings({
          build: {
            glob: (
              ...args: Array<bigint | boolean | number | string | RegExp | null>
            ) => `globbed:${args.join(",")}`,
            resolve: (
              pathArg: bigint | boolean | number | string | RegExp | null,
            ) => `resolved:${String(pathArg)}`,
          },
        }),
      );

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
      const result = analyzeTypeScript(
        code,
        createBindings({
          build: {
            resolve: (
              path: bigint | boolean | number | string | RegExp | null,
            ) => `resolved:${path}`,
          },
        }),
      );

      expect(result.replacements).toHaveLength(0);
    });

    it("should handle non-MemberExpression callees", () => {
      const code = "const result = resolve('./test');";
      const result = analyzeTypeScript(
        code,
        createBindings({
          build: {
            resolve: (
              path: bigint | boolean | number | string | RegExp | null,
            ) => `resolved:${path}`,
          },
        }),
      );
      expect(result.replacements).toHaveLength(0);
    });

    it("should skip traversal on syntax error if surfaced any parser errors", () => {
      const code = "const x = ; const y = import.meta.foo;";
      const result = analyzeTypeScript(
        code,
        createBindings({
          define: {
            foo: true,
          },
        }),
      );
      expect(result.parserDiagnostics.some((d) => d.severity === "error")).toBe(
        true,
      );
      expect(result.replacements).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});
