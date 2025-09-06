import MagicString from "magic-string";

import type { LiteralValue, TextReplacement } from "./types";

/**
 * @package
 */
export function applyReplacements(
  source: string,
  replacements: TextReplacement[],
): string {
  const magicString = new MagicString(source);

  for (const { end, replacement, start } of replacements) {
    magicString.overwrite(start, end, replacement);
  }

  return magicString.toString();
}

/**
 * @package
 */
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

/**
 * @package
 */
export function includesImportMeta(code: string): boolean {
  return code.includes("import.meta");
}
