import MagicString from "magic-string";

import type { CodeReplacement } from "./types";

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
