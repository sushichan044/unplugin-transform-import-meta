import type { SFCDescriptor, SFCScriptBlock } from "@vue/compiler-sfc";

import { parse as parseSFC } from "@vue/compiler-sfc";

import type { ResolveRules } from "./options";

import { extractImportMetaReplacements } from "./extract";
import { parseProgram } from "./parse";
import { transformWithReplacements } from "./replacement";

export interface VueTransformResult {
  code: string;
  warnings: string[];
}

export function transformVueSFC(
  source: string,
  filename: string,
  resolveRules: ResolveRules,
): VueTransformResult {
  const warnings: string[] = [];

  try {
    const { descriptor } = parseSFC(source, {
      filename,
      sourceMap: false,
    });

    const scriptBlock = getScriptBlock(descriptor);
    if (scriptBlock?.content == null) {
      return { code: source, warnings };
    }

    const scriptContent = scriptBlock.content;
    if (scriptContent.length === 0 || !scriptContent.includes("import.meta")) {
      return { code: source, warnings };
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
      return { code: source, warnings };
    }

    const transformedScript = transformWithReplacements(
      scriptContent,
      extractResult.replacements,
    );

    const transformedSource = replaceScriptContent(
      source,
      scriptBlock,
      transformedScript,
    );

    return { code: transformedSource, warnings };
  } catch (error) {
    warnings.push(`Failed to transform Vue SFC: ${String(error)}`);
    return { code: source, warnings };
  }
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
