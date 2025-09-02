import type { SFCDescriptor, SFCScriptBlock } from "@vue/compiler-sfc";

import { parse as parseSFC } from "@vue/compiler-sfc";

import type { ResolveRules } from "../options";
import type { LanguageProcessor, ParseResult, TransformResult } from "./types";

import { extractImportMetaReplacements } from "../extract";
import { parseProgram } from "../parse";
import { transformWithReplacements } from "../replacement";

export function createVueProcessor(): LanguageProcessor {
  return {
    parse(code: string, filename: string): ParseResult {
      try {
        const { descriptor } = parseSFC(code, {
          filename,
          sourceMap: false,
        });

        const scriptBlock = getScriptBlock(descriptor);
        if (scriptBlock?.content == null) {
          return {
            ast: parseProgram(""),
            sourceContent: code,
            warnings: [],
          };
        }

        const scriptContent = scriptBlock.content;
        if (
          scriptContent.length === 0 ||
          !scriptContent.includes("import.meta")
        ) {
          return {
            ast: parseProgram(""),
            sourceContent: code,
            warnings: [],
          };
        }

        const ast = parseProgram(scriptContent);
        return {
          ast,
          sourceContent: code,
          warnings: [],
        };
      } catch (error) {
        return {
          ast: parseProgram(""),
          sourceContent: code,
          warnings: [`Failed to parse Vue SFC: ${String(error)}`],
        };
      }
    },

    transform(
      parseResult: ParseResult,
      resolveRules: ResolveRules,
    ): TransformResult {
      const { sourceContent, warnings: parseWarnings } = parseResult;
      const warnings = [...parseWarnings];

      if (parseWarnings.length > 0) {
        return { code: sourceContent, warnings };
      }

      try {
        const { descriptor } = parseSFC(sourceContent, {
          sourceMap: false,
        });

        const scriptBlock = getScriptBlock(descriptor);
        if (scriptBlock?.content == null) {
          return { code: sourceContent, warnings };
        }

        const scriptContent = scriptBlock.content;
        if (
          scriptContent.length === 0 ||
          !scriptContent.includes("import.meta")
        ) {
          return { code: sourceContent, warnings };
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
          return { code: sourceContent, warnings };
        }

        const transformedScript = transformWithReplacements(
          scriptContent,
          extractResult.replacements,
        );

        const transformedSource = replaceScriptContent(
          sourceContent,
          scriptBlock,
          transformedScript,
        );

        return { code: transformedSource, warnings };
      } catch (error) {
        warnings.push(`Failed to transform Vue SFC: ${String(error)}`);
        return { code: sourceContent, warnings };
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
