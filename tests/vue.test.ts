import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import type { UserImportMetaBindings } from "../src/api";

import { createProcessor, resolveOptions } from "../src/api";
import { createTestContext } from "./utils";

describe("Vue SFC support", () => {
  it("should transform import.meta in <script> and <script setup> only", async () => {
    const source = await readFile(
      fileURLToPath(new URL("./fixtures/vue/before.vue", import.meta.url)),
      "utf-8",
    );

    const bindings: UserImportMetaBindings = {
      build: {
        fn: (a, b) => `${a}:${b}`,
      },
      define: {
        SCRIPT_VALUE: "script",
        SETUP_VALUE: "setup",
      },
    };

    const processor = await createProcessor("vue");
    const resolved = resolveOptions({ bindings });
    const result = await processor.transform(
      createTestContext("before.vue"),
      source,
      resolved.bindings,
    );

    await expect(result?.code).toMatchFileSnapshot("fixtures/vue/after.vue");
  });
});
