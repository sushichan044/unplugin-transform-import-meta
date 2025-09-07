import MagicString from "magic-string";

import type { LiteralValue, TextReplacement } from "./types";

/**
 * @package
 */
export function applyReplacements(
  source: string,
  replacements: TextReplacement[],
): string {
  if (replacements.length === 0) {
    return source;
  }

  const stableReplacements = replacements
    .slice()
    .sort((a, b) => a.start - b.start);

  const magicString = new MagicString(source);

  for (const { end, replacement, start } of stableReplacements) {
    magicString.overwrite(start, end, replacement);
  }

  return magicString.toString();
}

/**
 * @package
 */
export function serializeLiteralValue(value: LiteralValue): string {
  // Ensure the value is a valid literal
  if (!isLiteralValue(value)) {
    throw new TypeError(
      `Value is not a valid literal: ${typeof value} (${String(value)})`,
    );
  }

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
export function isLiteralValue(value: unknown): value is LiteralValue {
  return (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    value instanceof RegExp ||
    typeof value === "bigint"
  );
}

/**
 * @package
 */
export function includesImportMeta(code: string): boolean {
  return code.includes("import.meta");
}
