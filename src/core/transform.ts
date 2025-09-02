import MagicString from "magic-string";

import type { CodeReplacement } from "./extract";

export function transformWithReplacements(
  code: string,
  replacements: CodeReplacement[],
): string {
  const magicString = new MagicString(code);

  for (const { end, replacement, start } of replacements) {
    magicString.overwrite(start, end, replacement);
  }

  return magicString.toString();
}
