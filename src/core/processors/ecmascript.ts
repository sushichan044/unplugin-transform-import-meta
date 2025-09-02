import type { ResolveRules } from "../options";
import type { LanguageProcessor, ParseResult, TransformResult } from "./types";

import { extractImportMetaReplacements } from "../extract";
import { parseProgram } from "../parse";
import { transformWithReplacements } from "../replacement";

export function createECMAScriptProcessor(): LanguageProcessor {
  return {
    parse(
      code: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _filename: string,
    ): ParseResult {
      try {
        const ast = parseProgram(code);
        return {
          ast,
          code,
          warnings: [],
        };
      } catch (error) {
        return {
          ast: parseProgram(""),
          code,
          warnings: [`Failed to parse ECMAScript code: ${String(error)}`],
        };
      }
    },

    transform(
      parseResult: ParseResult,
      resolveRules: ResolveRules,
    ): TransformResult {
      const { ast, code, warnings: parseWarnings } = parseResult;
      const warnings = [...parseWarnings];

      try {
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
      } catch (error) {
        warnings.push(`Failed to transform ECMAScript code: ${String(error)}`);
        return { code: code, warnings };
      }
    },
  };
}
