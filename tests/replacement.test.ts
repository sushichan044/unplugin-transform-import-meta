import type { Program } from "estree";

import { parse } from "@typescript-eslint/typescript-estree";
import MagicString from "magic-string";
import { describe, expect, it } from "vitest";

import type { MethodFunction } from "../src/core/options";

import { extractImportMetaReplacements } from "../src/core/extract";
import { parseProgram } from "../src/core/parse";

describe("extractImportMetaReplacements", () => {
  it("should return transformations for simple property access", () => {
    const code = "const foo = import.meta.foo;";
    const ast = parseProgram(code);
    const resolveRules = {
      properties: {
        foo: true,
      },
    };

    const result = extractImportMetaReplacements(ast as Program, resolveRules);
    expect(result.replacements).toHaveLength(1);
    expect(result.warnings).toHaveLength(0);

    // Apply transformation to verify the result
    const magicString = new MagicString(code);
    if (result.replacements[0]) {
      magicString.overwrite(
        result.replacements[0].start,
        result.replacements[0].end,
        result.replacements[0].replacement,
      );
    }
    expect(magicString.toString()).toMatchInlineSnapshot(`"const foo = true;"`);
  });

  it("should return transformations for method calls", () => {
    const code = "const result = import.meta.bar();";
    const ast = parseProgram(code);
    const resolveRules = {
      methods: {
        bar: () => "hello",
      },
    };

    const result = extractImportMetaReplacements(ast as Program, resolveRules);
    expect(result.replacements).toHaveLength(1);
    expect(result.warnings).toHaveLength(0);
    expect(result.replacements[0]).toMatchObject({
      replacement: '"hello"',
    });

    // Apply transformation to verify the result
    const magicString = new MagicString(code);
    if (result.replacements[0]) {
      magicString.overwrite(
        result.replacements[0].start,
        result.replacements[0].end,
        result.replacements[0].replacement,
      );
    }
    expect(magicString.toString()).toMatchInlineSnapshot(
      `"const result = "hello";"`,
    );
  });

  it("should handle multiple transformations", () => {
    const code = `
const foo = import.meta.foo;
const env = import.meta.NODE_ENV;
const resolved = import.meta.resolve('./file');
    `.trim();

    const ast = parseProgram(code);

    const resolveRules = {
      methods: {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        resolve: (path: unknown) => `./resolved${path}`,
      },
      properties: {
        foo: true,
        NODE_ENV: "development",
      },
    };

    const result = extractImportMetaReplacements(ast as Program, resolveRules);
    expect(result.replacements).toHaveLength(3);
    expect(result.warnings).toHaveLength(0);

    // Apply transformations to verify the result
    const magicString = new MagicString(code);
    result.replacements
      .sort((a, b) => b.start - a.start)
      .forEach(({ end, replacement, start }) => {
        magicString.overwrite(start, end, replacement);
      });

    const transformed = magicString.toString();
    expect(transformed).toMatchInlineSnapshot(`
      "const foo = true;
      const env = "development";
      const resolved = "./resolved./file";"
    `);
  });

  it("should return empty transformations for unchanged import.meta", () => {
    const code = "const unknown = import.meta.unknown;";
    const ast = parse(code, {
      comment: true,
      extraFileExtensions: [".vue", ".svelte", ".astro"],
      jsDocParsingMode: "none",
      loc: true,
      project: false,
      range: true,
      sourceType: "module",
      suppressDeprecatedPropertyWarnings: true,
      tokens: false,
    });
    const resolveRules = {
      properties: {
        foo: true,
      },
    };

    const result = extractImportMetaReplacements(ast as Program, resolveRules);
    expect(result.replacements).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("should handle complex expressions", () => {
    const code = `
const config = {
  env: import.meta.environment,
  version: import.meta.getVersion('1.0.0')
};
    `.trim();

    const ast = parse(code, {
      comment: true,
      extraFileExtensions: [".vue", ".svelte", ".astro"],
      jsDocParsingMode: "none",
      loc: true,
      project: false,
      range: true,
      sourceType: "module",
      suppressDeprecatedPropertyWarnings: true,
      tokens: false,
    });

    const resolveRules = {
      methods: {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        getVersion: (version: unknown) => `v${version}`,
      },
      properties: {
        environment: "production",
      },
    };

    const result = extractImportMetaReplacements(ast as Program, resolveRules);
    expect(result.replacements).toHaveLength(2);
    expect(result.warnings).toHaveLength(0);

    // Apply transformations to verify the result
    const magicString = new MagicString(code);
    result.replacements
      .sort((a, b) => b.start - a.start)
      .forEach(({ end, replacement, start }) => {
        magicString.overwrite(start, end, replacement);
      });

    const transformed = magicString.toString();
    expect(transformed).toContain(`env: "production"`);
    expect(transformed).toContain(`version: "v1.0.0"`);
  });

  it("should generate warnings for non-literal arguments", () => {
    const code = `
const variableArg = "./file.js";
const resolved = import.meta.resolve(variableArg);
const mixed = import.meta.resolve("literal", someVar, 123);
    `.trim();

    const ast = parse(code, {
      comment: true,
      extraFileExtensions: [".vue", ".svelte", ".astro"],
      jsDocParsingMode: "none",
      loc: true,
      project: false,
      range: true,
      sourceType: "module",
      suppressDeprecatedPropertyWarnings: true,
      tokens: false,
    });

    const resolveRules = {
      methods: {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        resolve: (path: unknown) => `resolved:${path}`,
      },
    };

    const result = extractImportMetaReplacements(ast as Program, resolveRules);

    expect(result.warnings).toHaveLength(2);

    const firstWarning = result.warnings[0];
    if (firstWarning) {
      expect(firstWarning.methodName).toBe("resolve");
      expect(firstWarning.message).toBe(
        "Method resolve called with non-literal arguments",
      );
      expect(firstWarning.nonLiteralArgs).toEqual([
        { index: 0, type: "Identifier" },
      ]);
    }

    const secondWarning = result.warnings[1];
    if (secondWarning) {
      expect(secondWarning.methodName).toBe("resolve");
      expect(secondWarning.nonLiteralArgs).toEqual([
        { index: 1, type: "Identifier" },
      ]);
    }
  });

  it("should handle nested property access", () => {
    const code = `
const nested = import.meta.config.database.host;
const mixed = import.meta.api.version;
    `.trim();

    const ast = parseProgram(code);
    const resolveRules = {
      properties: {
        "api.version": "v1.2.3",
        "config.database.host": "localhost",
      },
    };

    const result = extractImportMetaReplacements(ast as Program, resolveRules);
    expect(result.replacements).toHaveLength(2);
    expect(result.warnings).toHaveLength(0);

    const magicString = new MagicString(code);
    result.replacements
      .sort((a, b) => b.start - a.start)
      .forEach(({ end, replacement, start }) => {
        magicString.overwrite(start, end, replacement);
      });

    const transformed = magicString.toString();
    expect(transformed).toContain('nested = "localhost"');
    expect(transformed).toContain('mixed = "v1.2.3"');
  });

  it("should handle nested method calls", () => {
    const code = `
const result = import.meta.utils.resolve("./test");
const config = import.meta.env.get("NODE_ENV");
    `.trim();

    const ast = parseProgram(code);
    const resolveRules = {
      methods: {
        "env.get": ((...args) => `${args[0]}_value`) as MethodFunction,
        "utils.resolve": ((...args) => `resolved:${args[0]}`) as MethodFunction,
      },
    };

    const result = extractImportMetaReplacements(ast as Program, resolveRules);
    expect(result.replacements).toHaveLength(2);
    expect(result.warnings).toHaveLength(0);

    const magicString = new MagicString(code);
    result.replacements
      .sort((a, b) => b.start - a.start)
      .forEach(({ end, replacement, start }) => {
        magicString.overwrite(start, end, replacement);
      });

    const transformed = magicString.toString();
    expect(transformed).toContain('result = "resolved:./test"');
    expect(transformed).toContain('config = "NODE_ENV_value"');
  });

  it("should handle TypeScript type assertions", () => {
    const code = `
const config = (import.meta).config;
const env = import.meta.environment;
const nested = import.meta.api.version;
    `.trim();

    const ast = parseProgram(code);
    const resolveRules = {
      properties: {
        "api.version": "v2.0.0",
        config: JSON.stringify({ database: "postgres" }),
        environment: "PRODUCTION",
      },
    };

    const result = extractImportMetaReplacements(ast as Program, resolveRules);
    expect(result.replacements).toHaveLength(3);
    expect(result.warnings).toHaveLength(0);

    const magicString = new MagicString(code);
    result.replacements
      .sort((a, b) => b.start - a.start)
      .forEach(({ end, replacement, start }) => {
        magicString.overwrite(start, end, replacement);
      });

    const transformed = magicString.toString();
    expect(transformed).toContain('config = "{\\"database\\":\\"postgres\\"}"');
    expect(transformed).toContain('env = "PRODUCTION"');
    expect(transformed).toContain('nested = "v2.0.0"');
  });
});
