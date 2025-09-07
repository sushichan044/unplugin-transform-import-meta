import type { LanguageProcessor } from "./types";

import { analyzeTypeScript } from "../analyze";
import { createReporter } from "../reporter";

/**
 * @package
 */
export function createECMAScriptProcessor(): LanguageProcessor {
  return {
    transform(c, code, bindings) {
      const reporter = createReporter(c);
      const result = analyzeTypeScript(code, bindings);
      const { hasParserError } = reporter.reportAnalysis(result);
      if (hasParserError) return null;

      const transformed = c.helpers.applyReplacements(
        code,
        result.replacements,
      );

      return { code: transformed, map: null };
    },
  };
}
