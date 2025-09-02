import type { SFCDescriptor, SFCScriptBlock } from "@vue/compiler-sfc";

import { parse as parseSFC } from "@vue/compiler-sfc";

import type { ResolveRules } from "../options";
import type { LanguageProcessor, TransformResult } from "./types";

import { extractImportMetaReplacements } from "../extract";
import { parseProgram } from "../parse";
import { transformWithReplacements } from "../transform";

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
          return { code, warnings };
        }

        const scriptContent = scriptBlock.content;
        if (
          scriptContent.length === 0 ||
          !scriptContent.includes("import.meta")
        ) {
          return { code, warnings };
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

        if (extractResult.replacements.length === 0) {
          return { code, warnings };
        }

        const transformedScript = transformWithReplacements(
          scriptContent,
          extractResult.replacements,
        );

        const transformedCode = replaceScriptContent(
          code,
          scriptBlock,
          transformedScript,
        );

        return { code: transformedCode, warnings };
      } catch (error) {
        warnings.push(
          `Failed to parse or transform Vue SFC. id: ${id}, code: ${String(error)}`,
        );
        return { code, warnings };
      }
    },
  };
}

function getScriptBlock(descriptor: SFCDescriptor): SFCScriptBlock | null {
  return descriptor.scriptSetup ?? descriptor.script;
}

function replaceScriptContent(
  originalSource: string,
  scriptBlock: SFCScriptBlock,
  newContent: string,
): string {
  const { loc } = scriptBlock;
  const contentStart = loc.start.offset;
  const contentEnd = loc.end.offset;

  const before = originalSource.slice(0, contentStart);
  const after = originalSource.slice(contentEnd);

  return before + newContent + after;
}
