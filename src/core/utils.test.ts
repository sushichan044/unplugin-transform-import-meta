import type { Node, RegExpLiteral } from "oxc-parser";

import { parseSync } from "oxc-parser";
import { describe, expect, it } from "vitest";
import { walk } from "zimmerframe";

import type { LiteralValue } from "./types";

import { serializeLiteralValue } from "./utils";

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
