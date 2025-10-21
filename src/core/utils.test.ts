import type { Node, RegExpLiteral } from "oxc-parser";

import { Result } from "@praha/byethrow";
import { parseSync } from "oxc-parser";
import { describe, expect, it } from "vitest";
import { walk } from "zimmerframe";

import type { LiteralValue } from "./types";

import { serializeLiteralValue, trySerializeValue } from "./utils";

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
});

describe("serializeSerializableValue", () => {
  it("should serialize arrays recursively", () => {
    const res = trySerializeValue([1, "a", true, /re/, null]);

    expect(Result.unwrap(res)).toBe('[1, "a", true, /re/, null]');
  });

  it("should serialize plain objects recursively", () => {
    const res = trySerializeValue({
      api: {
        baseUrl: "/api",
        headers: {
          Accept: "application/json",
        },
        retryCount: 3n,
      },
    });

    expect(Result.unwrap(res)).toBe(
      '{ api: { baseUrl: "/api", headers: { Accept: "application/json" }, retryCount: 3n } }',
    );
  });

  it("should wrap zero-argument functions with PURE annotation", () => {
    const fn = () => "ok";
    const res = trySerializeValue(fn);

    expect(Result.unwrap(res)).toBe('(/*#__PURE__*/(() => "ok"))');
  });

  it("should throw for non-serializable values", () => {
    const res = trySerializeValue(new Date() as never);

    expect(Result.unwrapError(res)).toBe("UNSUPPORTED_VALUE_TYPE");
  });

  it("should aggregate invalid object keys", () => {
    expect(() => trySerializeValue({ "not-valid": 1 } as never)).toThrow(
      AggregateError,
    );
  });

  it("should throw when function declares parameters", () => {
    const withArg = (value: unknown) => value;
    expect(() => trySerializeValue(withArg as never)).toThrow(TypeError);
  });

  it("should detect object cycles", () => {
    const loop: Record<string, unknown> = {};
    loop["self"] = loop;
    expect(() => trySerializeValue(loop as never)).toThrow(TypeError);
  });
});
