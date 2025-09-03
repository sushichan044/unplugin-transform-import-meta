import type { ResolveRules } from "../options";
import type { CodeReplacement } from "../types";
import type { LanguageProcessor, TransformResult } from "./types";

import { tryImport } from "../../utils/import";
import { analyzeTypeScript } from "../analyze";

export async function createAstroProcessor(): Promise<LanguageProcessor> {
  const astroMod =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    await tryImport<typeof import("@astrojs/compiler")>("@astrojs/compiler");

  const astroUtilMod = await tryImport<
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    typeof import("@astrojs/compiler/utils")
  >("@astrojs/compiler/utils");

  if (astroMod == null || astroUtilMod == null) {
    throw new Error(
      "Failed to import @astrojs/compiler or @astrojs/compiler/utils",
    );
  }

  return {
    async transform(
      code: string,
      id: string,
      resolveRules: ResolveRules,
    ): Promise<TransformResult> {
      const warnings: string[] = [];

      const allReplacements: CodeReplacement[] = [];
      try {
        // First extract and transform frontmatter
        const parseResult = await astroMod.parse(code, {
          position: true,
        });

        astroUtilMod.walk(parseResult.ast, (node) => {
          if (astroUtilMod.is.frontmatter(node)) {
            const result = analyzeTypeScript(node.value, resolveRules);

            if (result != null) {
              // Adjust positions for frontmatter
              const offset = node.position?.start?.offset ?? 0;
              const adjustedReplacements = result.replacements.map(
                (replacement) => ({
                  ...replacement,
                  end: replacement.end + offset + 3,
                  start: replacement.start + offset + 3, // +3 for '---'
                }),
              );

              allReplacements.push(...adjustedReplacements);
            }
          }

          if (astroUtilMod.is.expression(node) && node.children.length > 0) {
            for (const childNode of node.children) {
              if (!astroUtilMod.is.text(childNode)) {
                continue;
              }
              const result = analyzeTypeScript(childNode.value, resolveRules);

              if (result != null) {
                // Adjust positions for expression
                const offset = childNode.position?.start?.offset ?? 0;
                const adjustedReplacements = result.replacements.map(
                  (replacement) => ({
                    ...replacement,
                    end: replacement.end + offset,
                    start: replacement.start + offset,
                  }),
                );

                allReplacements.push(...adjustedReplacements);
              }
            }
          }

          if (
            astroUtilMod.is.element(node) &&
            node.name === "script" &&
            node.children.length > 0
          ) {
            for (const childNode of node.children) {
              if (!astroUtilMod.is.text(childNode)) {
                continue;
              }

              const result = analyzeTypeScript(childNode.value, resolveRules);

              if (result != null) {
                // Adjust positions for script tag content
                const offset = childNode.position?.start?.offset ?? 0;
                const adjustedReplacements = result.replacements.map(
                  (replacement) => ({
                    ...replacement,
                    end: replacement.end + offset,
                    start: replacement.start + offset,
                  }),
                );

                allReplacements.push(...adjustedReplacements);
              }
            }
          }
        });

        return {
          replacements: allReplacements,
          warnings,
        };
      } catch (error) {
        warnings.push(
          `Failed to process Astro file. id: ${id}, error: ${String(error)}`,
        );
        return { replacements: [], warnings };
      }
    },
  };
}
