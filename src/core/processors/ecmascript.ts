import type { ResolveRules } from "../options";
import type { LanguageProcessor, TransformResult } from "./types";

import { analyzeTypeScript } from "../analyze";

/**
 * @package
 */
export function createECMAScriptProcessor(): LanguageProcessor {
  return {
    transform(
      code: string,
      id: string,
      resolveRules: ResolveRules,
    ): TransformResult {
      const warnings: string[] = [];

      try {
        const result = analyzeTypeScript(code, resolveRules);

        if (result.warnings.length > 0) {
          warnings.push(
            ...result.warnings.map(
              (w) => `Warning: ${w.message} at ${w.start}-${w.end}`,
            ),
          );
        }

        return { replacements: result.replacements, warnings };
      } catch (parseError) {
        warnings.push(
          `Failed to parse ECMAScript. id: ${id}, error: ${String(parseError)}`,
        );
        return { replacements: [], warnings };
      }
    },
  };
}
