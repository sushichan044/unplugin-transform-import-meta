import { describe, expect, it } from "vitest";

import { detectLanguage } from "./index";

describe("detectLanguage", () => {
  it.each<[string, ReturnType<typeof detectLanguage>]>([
    // ecma-like
    ["index.js", "ecma"],
    ["index.jsx", "ecma"],
    ["index.ts", "ecma"],
    ["index.tsx", "ecma"],
    ["module.cjs", "ecma"],
    ["module.mjs", "ecma"],
    ["types.cts", "ecma"],
    ["types.mts", "ecma"],
    ["entry.js?raw", "ecma"],
    ["component.tsx?v=1", "ecma"],

    // astro-like
    ["App.astro", "astro"],
    ["App.astro?raw", "astro"],

    // vue-like
    ["Component.vue", "vue"],
    ["Component.vue?vue&type=script", "vue"],

    // unsupported
    ["style.css", null],
    ["README", null],
    ["data.json", null],

    // .d.ts variations should be excluded
    ["types.d.ts", null],
    ["types.d.cts", null],
    ["types.d.mts", null],
    ["Component.vue.d.ts", null],
    ["App.astro.d.ts?raw", null],
  ])("%s -> %s", (filename, expected) => {
    expect(detectLanguage(filename)).toBe(expected);
  });
});
