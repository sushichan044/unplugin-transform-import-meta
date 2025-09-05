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
  if (value == null) {
    return "null";
  }

  if (value instanceof RegExp) {
    return value.toString();
  }

  return JSON.stringify(value);
}
