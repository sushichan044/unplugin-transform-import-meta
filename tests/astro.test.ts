import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import type { ImportMetaBindings } from "../src/api";

import { createProcessor } from "../src/api";
import { createTestContext } from "./utils";

describe("Astro support", () => {
  it("should transform import.meta in all Astro contexts (frontmatter + script + expression)", async () => {
    const source = await readFile(
      fileURLToPath(new URL("./fixtures/astro/before.astro", import.meta.url)),
      "utf-8",
    );

    const bindings: ImportMetaBindings = {
      functions: {
        glob: (...args) => args.join(","),
      },
      values: {
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
      bindings,
    );

    await expect(result?.code).toMatchFileSnapshot(
      "fixtures/astro/after.astro",
    );
  });
});
