import type { ResolveRules } from "../options";
import type { LanguageProcessor, TransformResult } from "./types";

import { extractImportMetaReplacements } from "../extract";
import { parseProgram } from "../parse";
import { transformWithReplacements } from "../transform";

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
        const ast = parseProgram(code);

        const result = extractImportMetaReplacements(ast, resolveRules);

        if (result.warnings.length > 0) {
          warnings.push(
            ...result.warnings.map(
              (w) => `Warning: ${w.message} at ${w.start}-${w.end}`,
            ),
          );
        }

        if (result.replacements.length === 0) {
          return { code, warnings };
        }

        const transformedCode = transformWithReplacements(
          code,
          result.replacements,
        );

        return { code: transformedCode, warnings };
      } catch (parseError) {
        warnings.push(
          `Failed to parse ECMAScript. id: ${id}, error: ${String(parseError)}`,
        );
        return { code, warnings };
      }
    },
  };
}
