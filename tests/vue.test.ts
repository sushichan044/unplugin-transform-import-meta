import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import type { ImportMetaBindings } from "../src/api";

import { createProcessor, detectLanguage } from "../src/api";
import { createTestContext } from "./utils";

describe("Vue SFC support", () => {
  it("should detect Vue files", () => {
    expect(detectLanguage("App.vue")).toBe("vue");
    expect(detectLanguage("component.vue")).toBe("vue");
  });

  it("should transform import.meta in <script> and <script setup> only", async () => {
    const source = await readFile(
      fileURLToPath(new URL("./fixtures/vue/before.vue", import.meta.url)),
      "utf-8",
    );

    const bindings: ImportMetaBindings = {
      functions: {
        fn: (a, b) => `${a}:${b}`,
      },
      values: {
        SCRIPT_VALUE: "script",
        SETUP_VALUE: "setup",
      },
    };

    const processor = await createProcessor("vue");
    const result = await processor.transform(
      createTestContext("before.vue"),
      source,
      bindings,
    );

    await expect(result?.code).toMatchFileSnapshot("fixtures/vue/after.vue");
  });
});
