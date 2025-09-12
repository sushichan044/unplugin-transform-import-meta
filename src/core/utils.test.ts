import type { Node, RegExpLiteral } from "oxc-parser";

import { parseSync } from "oxc-parser";
import { describe, expect, it } from "vitest";
import { walk } from "zimmerframe";

import type { LiteralValue } from "./types";

import {
  isSerializableValue,
  serializeLiteralValue,
  serializeValue,
} from "./utils";

describe("serializeLiteralValue", () => {
  describe("JSON primitive serialization", () => {
    const tc: LiteralValue[] = ["hello", 42, true, false, null];

    it.each(tc)(
      "should serialize %s and output is equal to original value when parsed",
      (value) => {
        const serializedValue = serializeLiteralValue(value);
        const parsed = parseSync("literal.js", serializedValue);

        walk<Node, { count: number }>(
          parsed.program,
          {
            count: 0,
          },
          {
            Literal: (node, c) => {
              if (c.state.count > 0) {
                throw new Error("Multiple literals found");
              }

              expect(node.value).toStrictEqual(value);
              c.next({ count: c.state.count++ });
            },
          },
        );
      },
    );
  });

  describe("bigint serialization", () => {
    it("should serialize bigint and output is valid as JavaScript Literal", () => {
      const value = 9007199254741991n;

      const serializedValue = serializeLiteralValue(value);
      const parsed = parseSync("literal.js", serializedValue);

      walk<Node, { count: number }>(
        parsed.program,
        {
          count: 0,
        },
        {
          Literal: (node, c) => {
            if (c.state.count > 0) {
              throw new Error("Multiple literals found");
            }

            expect(typeof node.value).toBe("bigint");
            expect(node.value).toStrictEqual(value);
            c.next({ count: c.state.count++ });
          },
        },
      );
    });
  });

  describe("RegExp serialization", () => {
    it("should serialize RegExp and output is valid as JavaScript Literal", () => {
      const regexp = /ab+c/i;
      const regexInfo: RegExpLiteral["regex"] = {
        flags: regexp.flags,
        pattern: regexp.source,
      };

      const serializedValue = serializeLiteralValue(regexp);
      const parsed = parseSync("literal.js", serializedValue);

      walk<Node, { count: number }>(
        parsed.program,
        {
          count: 0,
        },
        {
          Literal: (node, c) => {
            if (c.state.count > 0) {
              throw new Error("Multiple literals found");
            }
            if (!(node.value instanceof RegExp)) {
              throw new Error("Not a RegExp");
            }

            expect((node as RegExpLiteral).regex).toEqual(regexInfo);
            c.next({ count: c.state.count++ });
          },
        },
      );
    });
  });

  describe("error cases", () => {
    const tc = [
      undefined,
      {},
      [],
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      Symbol("symbol"),
      NaN,
      Infinity,
      -Infinity,
    ];

    it.each(tc)("should throw TypeError when value is %s", (value) => {
      expect(() =>
        serializeLiteralValue(value as unknown as LiteralValue),
      ).toThrow(TypeError);
    });
  });
});

describe("serializeValue (JS)", () => {
  it("should serialize arrays recursively", () => {
    const value = [1, "a", true, /re/];
    const code = serializeValue(value);
    expect(code).toBe('[1, "a", true, /re/]');
  });

  it("should serialize plain objects recursively", () => {
    const value = {
      api: {
        baseUrl: "/api",
        headers: {
          Accept: "application/json",
        },
        retry: 3n,
      },
    };
    const code = serializeValue(value);
    expect(code).toMatchInlineSnapshot(
      `"{ api: { baseUrl: "/api", headers: { Accept: "application/json" }, retry: 3n } }"`,
    );
  });

  it("should serialize function values with PURE wrapper", () => {
    const fn = (x: LiteralValue) => x;
    const code = serializeValue(fn);

    expect(code).toMatchInlineSnapshot(`"(/*#__PURE__*/((x) => x))"`);
  });

  it("should serialize async function values with PURE wrapper", () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    const afn = async (x: LiteralValue) => x;
    const code = serializeValue(afn);

    expect(code).toMatchInlineSnapshot(`"(/*#__PURE__*/(async (x) => x))"`);
  });

  it("should throw on non-plain objects and unsupported instances", () => {
    class X {}
    const cases = [new Date(), new Map(), new Set(), new X()];
    for (const v of cases) {
      expect(() => serializeValue(v as unknown as LiteralValue)).toThrow(
        TypeError,
      );
    }
  });
});

describe("isSerializableValue", () => {
  it.each([
    null,
    1,
    "x",
    true,
    false,
    /re/,
    1n,
    [1, 2, "a", null, true, /re/, 3n],
    { a: 1, b: "x", c: null, d: [1, 2], e: { f: false } },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    function () {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async function () {},
  ])("should accept %s", (value) => {
    expect(isSerializableValue(value)).toBe(true);
  });

  it.each([
    new Date(),
    new Map(),
    new Set(),
    undefined,
    NaN,
    Infinity,
    -Infinity,
    Symbol("symbol"),
    class X {
      constructor() {}
    },
  ])("should reject %s", (value) => {
    expect(isSerializableValue(value)).toBe(false);
  });
});
