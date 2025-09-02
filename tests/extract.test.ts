import { describe, expect, it } from "vitest";

import type { ResolveRules } from "../src/core/options";

import { extractImportMetaReplacements } from "../src/core/extract";
import { parseProgram } from "../src/core/parse";
import { transformWithReplacements } from "../src/core/transform";

describe("extractImportMetaReplacements", () => {
  type BasicTestCase = {
    code: string;
    expectedReplacements: number;
    expectedTransformed?: string;
    expectedWarnings: number;
    name: string;
    resolveRules: ResolveRules;
  };

  const basicTestCases: BasicTestCase[] = [
    {
      code: "const foo = import.meta.foo;",
      expectedReplacements: 1,
      expectedTransformed: "const foo = true;",
      expectedWarnings: 0,
      name: "should return transformations for simple property access",
      resolveRules: {
        properties: {
          foo: true,
        },
      },
    },
    {
      code: "const result = import.meta.bar();",
      expectedReplacements: 1,
      expectedTransformed: 'const result = "hello";',
      expectedWarnings: 0,
      name: "should return transformations for method calls",
      resolveRules: {
        methods: {
          bar: () => "hello",
        },
      },
    },
    {
      code: "const unknown = import.meta.unknown;",
      expectedReplacements: 0,
      expectedWarnings: 0,
      name: "should return empty transformations for unchanged import.meta",
      resolveRules: {
        properties: {
          foo: true,
        },
      },
    },
    {
      code: "const nested = import.meta.config.database.host;",
      expectedReplacements: 1,
      expectedTransformed: 'const nested = "localhost";',
      expectedWarnings: 0,
      name: "should handle nested property access",
      resolveRules: {
        properties: {
          "config.database.host": "localhost",
        },
      },
    },
    {
      code: "const result = import.meta.utils.resolve('./test');",
      expectedReplacements: 1,
      expectedTransformed: 'const result = "resolved:./test";',
      expectedWarnings: 0,
      name: "should handle nested method calls",
      resolveRules: {
        methods: {
          "utils.resolve": (...args) => `resolved:${args[0]}`,
        },
      },
    },
  ];

  it.each(basicTestCases)(
    "$name",
    ({
      code,
      expectedReplacements,
      expectedTransformed,
      expectedWarnings,
      resolveRules,
    }) => {
      const ast = parseProgram(code.trim());
      const result = extractImportMetaReplacements(ast, resolveRules);

      expect(result.replacements).toHaveLength(expectedReplacements);
      expect(result.warnings).toHaveLength(expectedWarnings);

      if (expectedTransformed !== undefined && result.replacements.length > 0) {
        const transformed = transformWithReplacements(
          code,
          result.replacements,
        );
        expect(transformed).toBe(expectedTransformed);
      }
    },
  );

  it("should handle multiple transformations", () => {
    const code = `
const foo = import.meta.foo;
const env = import.meta.NODE_ENV;
const resolved = import.meta.resolve('./file');
    `.trim();
    const ast = parseProgram(code);

    const resolveRules: ResolveRules = {
      methods: {
        resolve: (path) => `./resolved${path}`,
      },
      properties: {
        foo: true,
        NODE_ENV: "development",
      },
    };

    const result = extractImportMetaReplacements(ast, resolveRules);
    expect(result.replacements).toHaveLength(3);
    expect(result.warnings).toHaveLength(0);

    const transformed = transformWithReplacements(code, result.replacements);
    expect(transformed).toMatchInlineSnapshot(`
      "const foo = true;
      const env = "development";
      const resolved = "./resolved./file";"
    `);
  });

  it("should handle complex expressions", () => {
    const code = `
const config = {
  env: import.meta.environment,
  version: import.meta.getVersion('1.0.0')
};
    `.trim();
    const ast = parseProgram(code);

    const resolveRules: ResolveRules = {
      methods: {
        getVersion: (version) => `v${String(version)}`,
      },
      properties: {
        environment: "production",
      },
    };

    const result = extractImportMetaReplacements(ast, resolveRules);
    expect(result.replacements).toHaveLength(2);
    expect(result.warnings).toHaveLength(0);

    const transformed = transformWithReplacements(code, result.replacements);
    expect(transformed).toMatchInlineSnapshot(`
      "const config = {
        env: "production",
        version: "v1.0.0"
      };"
    `);
  });

  it("should generate warnings for non-literal arguments", () => {
    const code = `
const variableArg = "./file.js";
const resolved = import.meta.resolve(variableArg);
const mixed = import.meta.resolve("literal", someVar, 123);
    `.trim();

    const ast = parseProgram(code);

    const resolveRules: ResolveRules = {
      methods: {
        resolve: (path) => `resolved:${String(path)}`,
      },
    };

    const result = extractImportMetaReplacements(ast, resolveRules);

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
          "end": 142,
          "message": "Method resolve called with non-literal arguments",
          "methodName": "resolve",
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
  });
});
