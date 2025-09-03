import type { SFCDescriptor, SFCScriptBlock } from "@vue/compiler-sfc";

import { parse as parseSFC } from "@vue/compiler-sfc";

import type { ResolveRules } from "../options";
import type { LanguageProcessor, TransformResult } from "./types";

import { extractImportMetaReplacements } from "../extract";
import { parseProgram } from "../parse";

/**
 * @package
 */
export function createVueProcessor(): LanguageProcessor {
  return {
    transform(
      code: string,
      id: string,
      resolveRules: ResolveRules,
    ): TransformResult {
      const warnings: string[] = [];

      try {
        const { descriptor } = parseSFC(code, {
          filename: id,
          sourceMap: false,
        });

        const scriptBlock = getScriptBlock(descriptor);
        if (scriptBlock?.content == null) {
          return { replacements: [], warnings };
        }

        const scriptContent = scriptBlock.content;
        if (
          scriptContent.length === 0 ||
          !scriptContent.includes("import.meta")
        ) {
          return { replacements: [], warnings };
        }

        const scriptAst = parseProgram(scriptContent);
        const extractResult = extractImportMetaReplacements(
          scriptAst,
          resolveRules,
        );

        if (extractResult.warnings.length > 0) {
          warnings.push(
            ...extractResult.warnings.map(
              (w) => `Warning: ${w.message} at ${w.start}-${w.end}`,
            ),
          );
        }

        // Adjust replacements to be relative to the full Vue file, not just the script block
        const adjustedReplacements = extractResult.replacements.map((r) => ({
          end: scriptBlock.loc.start.offset + r.end,
          replacement: r.replacement,
          start: scriptBlock.loc.start.offset + r.start,
        }));

        return { replacements: adjustedReplacements, warnings };
      } catch (error) {
        warnings.push(
          `Failed to parse or transform Vue SFC. id: ${id}, code: ${String(error)}`,
        );
        return { replacements: [], warnings };
      }
    },
  };
}

function getScriptBlock(descriptor: SFCDescriptor): SFCScriptBlock | null {
  return descriptor.scriptSetup ?? descriptor.script;
}
