import type { LanguageProcessor } from "./types";

import { analyzeTypeScript } from "../analyze";

/**
 * @package
 */
export function createECMAScriptProcessor(): LanguageProcessor {
  return {
    transform(c, code, resolveRules) {
      const result = analyzeTypeScript(code, resolveRules);
      const transformed = c.helpers.applyReplacements(
        code,
        result.replacements,
      );

      return { code: transformed, map: null };
    },
  };
}
