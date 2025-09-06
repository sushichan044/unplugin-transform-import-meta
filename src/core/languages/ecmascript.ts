import type { LanguageProcessor } from "./types";

import { analyzeTypeScript } from "../analyze";

/**
 * @package
 */
export function createECMAScriptProcessor(): LanguageProcessor {
  return {
    transform(c, code, bindings) {
      const result = analyzeTypeScript(code, bindings);
      if (result.errors.length > 0) {
        for (const err of result.errors) {
          c.logger.error({
            id: c.id,
            message: err.message,
            meta: err.meta,
          });
        }
      }

      const transformed = c.helpers.applyReplacements(
        code,
        result.replacements,
      );

      return { code: transformed, map: null };
    },
  };
}
