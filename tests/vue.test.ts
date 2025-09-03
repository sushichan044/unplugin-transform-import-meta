import { describe, expect, it } from "vitest";

import { applyReplacements } from "../src/core/apply";
import { createProcessor, detectLanguage } from "../src/core/processors";

describe.skip("Vue SFC support", () => {
  it("should detect Vue files", () => {
    expect(detectLanguage("App.vue")).toBe("vue");
    expect(detectLanguage("component.vue")).toBe("vue");
    expect(detectLanguage("index.js")).toBe("ecma");
    expect(detectLanguage("index.ts")).toBe("ecma");
  });

  it("should transform import.meta in Vue SFC", async () => {
    const source = `<template>
  <div>
    <h1>{{ title }}</h1>
    <p>Environment: {{ env }}</p>
  </div>
</template>

<script setup>
const title = "Vue SFC Test";
const env = import.meta.env.NODE_ENV;
</script>

<style scoped>
div {
  padding: 20px;
}
</style>`;

    const resolveRules = {
      methods: {},
      properties: {
        "env.NODE_ENV": "development",
      },
    };

    const processor = await createProcessor("vue");

    const result = await processor.transform(source, "test.vue", resolveRules);

    const transformedCode = applyReplacements(source, result.replacements);
    expect(transformedCode).toContain('"development"');
    expect(transformedCode).not.toContain("import.meta.env.NODE_ENV");
    expect(result.warnings).toHaveLength(0);
  });

  it("should handle Vue SFC without import.meta", async () => {
    const source = `<template>
  <div>
    <h1>{{ title }}</h1>
  </div>
</template>

<script setup>
const title = "Vue SFC Test";
</script>

<style scoped>
div {
  padding: 20px;
}
</style>`;

    const resolveRules = {
      methods: {},
      properties: {
        "env.NODE_ENV": "development",
      },
    };

    const processor = await createProcessor("vue");

    const result = await processor.transform(source, "test.vue", resolveRules);

    const transformedCode = applyReplacements(source, result.replacements);
    expect(transformedCode).toBe(source);
    expect(result.warnings).toHaveLength(0);
  });

  it("should handle regular script block", async () => {
    const source = `<template>
  <div>
    <h1>{{ title }}</h1>
    <p>Environment: {{ env }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      title: "Vue SFC Test",
      env: import.meta.env.NODE_ENV,
    };
  },
};
</script>

<style scoped>
div {
  padding: 20px;
}
</style>`;

    const resolveRules = {
      methods: {},
      properties: {
        "env.NODE_ENV": "production",
      },
    };

    const processor = await createProcessor("vue");

    const result = await processor.transform(source, "test.vue", resolveRules);

    const transformedCode = applyReplacements(source, result.replacements);
    expect(transformedCode).toContain('"production"');
    expect(transformedCode).not.toContain("import.meta.env.NODE_ENV");
    expect(result.warnings).toHaveLength(0);
  });
});
