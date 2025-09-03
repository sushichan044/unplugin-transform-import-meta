import type { ResolveRules } from "../options";
import type { LanguageProcessor, TransformResult } from "./types";

import { extractImportMetaReplacements } from "../extract";
import { parseProgram } from "../parse";
import { transformWithReplacements } from "../transform";

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type SveltePkg = typeof import("svelte/compiler");

export function createSvelteProcessor(): LanguageProcessor {
  return {
    async transform(
      code: string,
      id: string,
      resolveRules: ResolveRules,
    ): Promise<TransformResult> {
      const warnings: string[] = [];

      try {
        let svelte: SveltePkg;

        try {
          svelte = await import("svelte/compiler");
        } catch {
          warnings.push(
            `svelte/compiler not found. Please install it to process .svelte files. id: ${id}`,
          );
          return { code, warnings };
        }

        // Parse with modern AST
        const ast = svelte.parse(code, {
          modern: true,
        });

        let transformedCode = code;

        // Process <script> tag
        if (ast.instance && code.includes("import.meta")) {
          const scriptContent = code.slice(
            ast.instance.start,
            ast.instance.end,
          );

          const openTagEnd = scriptContent.indexOf(">") + 1;
          const closeTagStart = scriptContent.lastIndexOf("</script>");
          const jsContent = scriptContent.slice(openTagEnd, closeTagStart);

          if (jsContent.includes("import.meta")) {
            const result = processJavaScriptContent(
              jsContent,
              resolveRules,
              warnings,
            );
            if (result != null) {
              const newScriptContent =
                scriptContent.slice(0, openTagEnd) +
                result +
                scriptContent.slice(closeTagStart);
              transformedCode =
                transformedCode.slice(0, ast.instance.start) +
                newScriptContent +
                transformedCode.slice(ast.instance.end);
            }
          }
        }

        // Process <script module> tag
        if (ast.module && transformedCode.includes("import.meta")) {
          const scriptContent = transformedCode.slice(
            ast.module.start,
            ast.module.end,
          );

          const openTagEnd = scriptContent.indexOf(">") + 1;
          const closeTagStart = scriptContent.lastIndexOf("</script>");
          const jsContent = scriptContent.slice(openTagEnd, closeTagStart);

          if (jsContent.includes("import.meta")) {
            const result = processJavaScriptContent(
              jsContent,
              resolveRules,
              warnings,
            );
            if (result != null) {
              const newScriptContent =
                scriptContent.slice(0, openTagEnd) +
                result +
                scriptContent.slice(closeTagStart);
              transformedCode =
                transformedCode.slice(0, ast.module.start) +
                newScriptContent +
                transformedCode.slice(ast.module.end);
            }
          }
        }

        // TODO: Process template expressions in future implementation

        return { code: transformedCode, warnings };
      } catch (error) {
        warnings.push(
          `Failed to process Svelte file. id: ${id}, error: ${String(error)}`,
        );
        return { code, warnings };
      }
    },
  };
}

function processJavaScriptContent(
  content: string,
  resolveRules: ResolveRules,
  warnings: string[],
): string | null {
  try {
    const ast = parseProgram(content);
    const extractResult = extractImportMetaReplacements(ast, resolveRules);

    if (extractResult.warnings.length > 0) {
      warnings.push(
        ...extractResult.warnings.map(
          (w) => `Warning: ${w.message} at ${w.start}-${w.end}`,
        ),
      );
    }

    if (extractResult.replacements.length === 0) {
      return null;
    }

    return transformWithReplacements(content, extractResult.replacements);
  } catch (error) {
    warnings.push(
      `Failed to parse JavaScript content in Svelte file: ${String(error)}`,
    );
    return null;
  }
}
