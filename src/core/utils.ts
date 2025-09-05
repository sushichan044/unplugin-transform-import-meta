import MagicString from "magic-string";

import type { CodeReplacement, LiteralValue } from "./types";

export function applyReplacements(
  source: string,
  replacements: CodeReplacement[],
): string {
  const magicString = new MagicString(source);

  for (const { end, replacement, start } of replacements) {
    magicString.overwrite(start, end, replacement);
  }

  return magicString.toString();
}

export function serializeLiteralValue(value: LiteralValue): string {
  if (value instanceof RegExp) {
    return value.toString();
  }

  if (typeof value === "bigint") {
    // The trailing "n" is not part of the string.
    return value.toString() + "n";
  }

  return JSON.stringify(value);
}
