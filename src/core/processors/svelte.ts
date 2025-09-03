import type { ResolveRules } from "../options";
import type { CodeReplacement } from "../types";
import type { LanguageProcessor, TransformResult } from "./types";

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type SveltePkg = typeof import("svelte/compiler");

export function createSvelteProcessor(): LanguageProcessor {
  return {
    async transform(
      code: string,
      id: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _resolveRules: ResolveRules,
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
          return { replacements: [], warnings };
        }

        // Parse with modern AST
        const ast = svelte.parse(code, {
          modern: true,
        });

        const allReplacements: CodeReplacement[] = [];

        // Process <script> tag
        if (ast.instance && code.includes("import.meta")) {
          warnings.push(
            "Script tag processing in Svelte files is not yet fully implemented",
          );
        }

        // Process <script module> tag
        if (ast.module && code.includes("import.meta")) {
          warnings.push(
            "Module script processing in Svelte files is not yet fully implemented",
          );
        }

        // TODO: Implement proper CodeReplacement calculation for Svelte script tags

        return { replacements: allReplacements, warnings };
      } catch (error) {
        warnings.push(
          `Failed to process Svelte file. id: ${id}, error: ${String(error)}`,
        );
        return { replacements: [], warnings };
      }
    },
  };
}
