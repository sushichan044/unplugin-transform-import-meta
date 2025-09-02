import { describe, expect, it } from "vitest";

import { isVueFile } from "../src/core/vue-detector";
import { transformVueSFC } from "../src/core/vue-transform";

describe("Vue SFC support", () => {
  it("should detect Vue files", () => {
    expect(isVueFile("App.vue")).toBe(true);
    expect(isVueFile("component.vue")).toBe(true);
    expect(isVueFile("index.js")).toBe(false);
    expect(isVueFile("index.ts")).toBe(false);
  });

  it("should transform import.meta in Vue SFC", () => {
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

    const result = transformVueSFC(source, "test.vue", resolveRules);

    expect(result.code).toContain('"development"');
    expect(result.code).not.toContain("import.meta.env.NODE_ENV");
    expect(result.warnings).toHaveLength(0);
  });

  it("should handle Vue SFC without import.meta", () => {
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

    const result = transformVueSFC(source, "test.vue", resolveRules);

    expect(result.code).toBe(source);
    expect(result.warnings).toHaveLength(0);
  });

  it("should handle regular script block", () => {
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

    const result = transformVueSFC(source, "test.vue", resolveRules);

    expect(result.code).toContain('"production"');
    expect(result.code).not.toContain("import.meta.env.NODE_ENV");
    expect(result.warnings).toHaveLength(0);
  });
});
