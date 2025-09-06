import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import type { ResolveRules } from "../src";

import { createProcessor, detectLanguage } from "../src/core/languages";
import { createTestContext } from "./utils";

describe("Astro support", () => {
  it("should detect Astro files", () => {
    expect(detectLanguage("App.astro")).toBe("astro");
    expect(detectLanguage("component.astro")).toBe("astro");
    expect(detectLanguage("index.js")).toBe("ecma");
    expect(detectLanguage("index.ts")).toBe("ecma");
  });

  it("should transform import.meta in all Astro contexts (frontmatter + script + expression)", async () => {
    const source = await readFile(
      fileURLToPath(new URL("./fixtures/astro/before.astro", import.meta.url)),
      "utf-8",
    );

    const resolveRules: ResolveRules = {
      methods: {
        glob: (...args) => args.join(","),
      },
      properties: {
        "env.MODE": "build",
        "env.NODE_ENV": "production",
        "env.RELEASED": true,
        HEADING: "heading",
        KLASS: "className",
      },
    };

    const processor = await createProcessor("astro");
    const result = await processor.transform(
      createTestContext("before.astro"),
      source,
      resolveRules,
    );

    await expect(result?.code).toMatchFileSnapshot(
      "fixtures/astro/after.astro",
    );
  });
});
