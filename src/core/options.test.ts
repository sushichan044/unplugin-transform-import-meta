import { describe, expect, it } from "vitest";

import type { LiteralValue } from "./types";

import { normalizeBindings } from "./options";

describe("normalizeBindings", () => {
  it("flattens nested objects and registers parent nodes", () => {
    const fn = (x: LiteralValue) => x;
    const bindings = {
      config: {
        api: { baseUrl: "/api" },
        retry: 3n,
      },
      fn,
      list: [1, "a", true],
    };

    const flat = normalizeBindings(bindings);

    expect(flat["config.api.baseUrl"]).toEqual({
      type: "value",
      value: "/api",
    });
    expect(flat["config.retry"]).toEqual({
      type: "value",
      value: 3n,
    });
    expect(flat["list"]).toEqual({
      type: "value",
      value: [1, "a", true],
    });
    expect(flat["fn"]).toEqual({
      type: "function",
      value: fn,
    });
  });

  it("throws when top-level key contains a dot", () => {
    expect(() => normalizeBindings({ "foo.bar": { baz: 1 } })).toThrow(
      TypeError,
    );
  });

  it("throws when nested key contains a dot", () => {
    expect(() => normalizeBindings({ foo: { "bar.baz": 1 } })).toThrow(
      TypeError,
    );
  });

  it("throws on non-plain object values", () => {
    expect(() =>
      normalizeBindings({ bad: new Date() } as unknown as never),
    ).toThrow(TypeError);
  });

  it("detects cycles to avoid infinite recursion", () => {
    const a = { cycle: {} };
    a.cycle = a;

    expect(() => normalizeBindings({ a })).toThrow(TypeError);
  });

  it("detects complex nested cycles", () => {
    const obj1 = { level1: { back: {}, next: {} } };
    const obj2 = { level2: { back: {}, next: {} } };
    const obj3 = { level3: { back: {}, next: {} } };

    obj1.level1.next = obj2;
    obj2.level2.next = obj3;
    obj3.level3.back = obj1;

    expect(() => normalizeBindings({ complex: obj1 })).toThrow(TypeError);
  });
});
