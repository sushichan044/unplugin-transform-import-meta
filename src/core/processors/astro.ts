import type {
  Node as AstroNode,
  ComponentNode,
  CustomElementNode,
  ElementNode,
} from "@astrojs/compiler/types";

import { walk } from "zimmerframe";

import type { ResolveRules } from "../options";
import type { CodeReplacement } from "../types";
import type { LanguageProcessor, TransformResult } from "./types";

import { tryImport } from "../../utils/import";
import { analyzeTypeScript } from "../analyze";
import { includesImportMeta } from "../index";

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
      "Failed to import @astrojs/compiler. Please install it to process .astro files.",
    );
  }

  return {
    async transform(
      code: string,
      id: string,
      resolveRules: ResolveRules,
    ): Promise<TransformResult> {
      const parseResult = await astroMod.parse(code, {
        position: true,
      });

      const allReplacements: CodeReplacement[] = [];
      const warnings: string[] = [];

      walk<AstroNode, Record<string, never>>(
        parseResult.ast,
        {},
        {
          frontmatter: (node) => {
            if (!includesImportMeta(node.value)) {
              return;
            }

            const result = analyzeTypeScript(node.value, resolveRules);
            const s = node.position?.start?.offset ?? 0;
            const offset = s + 3; // 3: length of "---"

            const adjustedReplacements = result.replacements.map(
              (replacement) => ({
                ...replacement,
                end: replacement.end + offset,
                start: replacement.start + offset,
              }),
            );
            allReplacements.push(...adjustedReplacements);
          },

          element: (node, c) => {
            allReplacements.push(...handleTagNode(node, resolveRules));
            c.next();
          },

          component: (node, c) => {
            allReplacements.push(...handleTagNode(node, resolveRules));
            c.next();
          },

          "custom-element": (node, c) => {
            allReplacements.push(...handleTagNode(node, resolveRules));
            c.next();
          },

          text: (node, c) => {
            const parent = c.path.at(-1);

            // We can write TS code only in <script> tag
            if (parent?.type === "element" && parent.name === "script") {
              const result = analyzeTypeScript(node.value, resolveRules);
              const offset = node.position?.start?.offset ?? 0;

              const adjustedReplacements = result.replacements.map(
                (replacement) => ({
                  ...replacement,
                  end: replacement.end + offset,
                  start: replacement.start + offset,
                }),
              );
              allReplacements.push(...adjustedReplacements);
            }
          },

          expression: (node) => {
            // serialize the expression to a block statement to parse whole expression
            const blockStmt = astroUtilMod.serialize(node);
            const result = analyzeTypeScript(blockStmt, resolveRules);

            const s = node.position?.start?.offset ?? 0;
            const offset = s + 1; // 1: length of "{"

            const adjustedReplacements = result.replacements.map(
              (replacement) => ({
                ...replacement,
                end: replacement.end + offset,
                start: replacement.start + offset,
              }),
            );
            allReplacements.push(...adjustedReplacements);
          },
        },
      );

      return {
        replacements: allReplacements,
        warnings,
      };
    },
  };
}

function handleTagNode(
  node: ComponentNode | CustomElementNode | ElementNode,
  resolveRules: ResolveRules,
): CodeReplacement[] {
  const allReplacements: CodeReplacement[] = [];

  for (const attr of node.attributes) {
    if (attr.kind === "empty" || attr.kind === "quoted") {
      continue;
    }

    if (includesImportMeta(attr.value)) {
      const result = analyzeTypeScript(attr.value, resolveRules);
      const s = attr.position?.start?.offset ?? 0;
      const offset = s + attr.name.length + 2; // 2: length of "={"

      const adjustedReplacements = result.replacements.map((replacement) => ({
        ...replacement,
        end: replacement.end + offset,
        start: replacement.start + offset,
      }));
      allReplacements.push(...adjustedReplacements);
    }
  }

  return allReplacements;
}
