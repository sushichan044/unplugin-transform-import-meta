import type { ResolveRules } from "../options";
import type { LanguageProcessor, TransformResult } from "./types";

import { extractImportMetaReplacements } from "../extract";
import { parseProgram } from "../parse";
import { transformWithReplacements } from "../transform";

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type AstroCompilerPkg = typeof import("@astrojs/compiler");

export function createAstroProcessor(): LanguageProcessor {
  return {
    async transform(
      code: string,
      id: string,
      resolveRules: ResolveRules,
    ): Promise<TransformResult> {
      const warnings: string[] = [];

      try {
        let astroCompiler: AstroCompilerPkg;

        try {
          astroCompiler = await import("@astrojs/compiler");
        } catch {
          warnings.push(
            `@astrojs/compiler not found. Please install it to process .astro files. id: ${id}`,
          );
          return { code, warnings };
        }

        // First extract and transform frontmatter
        const parseResult = await astroCompiler.parse(code, {
          position: true,
        });

        let transformedCode = code;

        // Process frontmatter if it exists
        const frontmatterNode = parseResult.ast.children?.find(
          (child) => child.type === "frontmatter",
        );

        if (frontmatterNode?.value?.includes("import.meta") == true) {
          const scriptContent = frontmatterNode.value;
          const result = processJavaScriptContent(
            scriptContent,
            resolveRules,
            warnings,
          );
          if (result != null) {
            const start = frontmatterNode.position?.start?.offset ?? 0;
            const end = frontmatterNode.position?.end?.offset ?? 0;
            transformedCode =
              transformedCode.slice(0, start) +
              "---" +
              result +
              "---" +
              transformedCode.slice(end);
          }
        }

        // Process script elements by using transform to get preprocessed JS
        if (code.includes("<script") && code.includes("import.meta")) {
          try {
            const transformResult = await astroCompiler.transform(code, {
              filename: id,
              sourcemap: false,
            });

            // Extract JS from transform result and process it
            const jsCode = transformResult.code;
            if (jsCode.includes("import.meta")) {
              const processedJS = processJavaScriptContent(
                jsCode,
                resolveRules,
                warnings,
              );
              if (processedJS != null) {
                // This is a simplified approach - in reality we'd need to map back to original positions
                warnings.push(
                  "Script transformation in Astro files is experimental",
                );
              }
            }
          } catch (transformError) {
            warnings.push(
              `Failed to transform Astro to JS: ${String(transformError)}`,
            );
          }
        }

        return { code: transformedCode, warnings };
      } catch (error) {
        warnings.push(
          `Failed to process Astro file. id: ${id}, error: ${String(error)}`,
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
      `Failed to parse JavaScript content in Astro file: ${String(error)}`,
    );
    return null;
  }
}
