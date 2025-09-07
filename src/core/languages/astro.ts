import type {
  DiagnosticMessage,
  Node,
  TagLikeNode,
} from "@astrojs/compiler/types";

import { DiagnosticSeverity } from "@astrojs/compiler/types";
import { walk } from "zimmerframe";

import type { TransformerContext } from "../context";
import type { ImportMetaBindings, TextReplacement } from "../types";
import type { LanguageProcessor } from "./types";

import { tryImport } from "../../utils/import";
import { analyzeTypeScript } from "../analyze";
import { createReporter } from "../reporter";
import { includesImportMeta } from "../utils";

/**
 * @package
 */
export async function createAstroProcessor(): Promise<LanguageProcessor> {
  const astro =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    await tryImport<typeof import("@astrojs/compiler")>("@astrojs/compiler");

  const astroUtil = await tryImport<
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    typeof import("@astrojs/compiler/utils")
  >("@astrojs/compiler/utils");

  if (astro == null || astroUtil == null) {
    throw new Error(
      "Failed to import @astrojs/compiler. Please install it to process .astro files.",
    );
  }

  return {
    async transform(unCtx, code, bindings) {
      if (!includesImportMeta(code)) {
        return null;
      }

      const reporter = createReporter(unCtx);

      const parseResult = await astro.parse(code, {
        position: true,
      });
      const severeDiagnostics = extractSevereDiagnostics(
        parseResult.diagnostics,
      );
      if (severeDiagnostics.error.length > 0) {
        for (const err of severeDiagnostics.error) {
          reporter.error({ message: err.text, meta: err.location });
        }
        return null;
      }
      if (severeDiagnostics.warning.length > 0) {
        for (const warn of severeDiagnostics.warning) {
          reporter.warn({ message: warn.text, meta: warn.location });
        }
        return null;
      }

      const allReplacements: TextReplacement[] = [];

      walk<Node, Record<string, never>>(
        parseResult.ast,
        {},
        {
          frontmatter: (node) => {
            if (!includesImportMeta(node.value)) {
              return;
            }

            const result = analyzeTypeScript(node.value, bindings);
            const s = node.position?.start?.offset ?? 0;
            const offset = s + 3; // 3: length of "---"

            const { hasParserError } = reporter.reportAnalysis(result);
            if (hasParserError) return;

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
            allReplacements.push(...handleTagNode(unCtx, code, node, bindings));
            c.next();
          },

          fragment: (node, c) => {
            allReplacements.push(...handleTagNode(unCtx, code, node, bindings));
            c.next();
          },

          component: (node, c) => {
            allReplacements.push(...handleTagNode(unCtx, code, node, bindings));
            c.next();
          },

          "custom-element": (node, c) => {
            allReplacements.push(...handleTagNode(unCtx, code, node, bindings));
            c.next();
          },

          text: (node, c) => {
            const parent = c.path.at(-1);

            // We can write TS code only in <script> tag
            if (parent?.type === "element" && parent.name === "script") {
              const result = analyzeTypeScript(node.value, bindings);
              const offset = node.position?.start?.offset ?? 0;

              const { hasParserError } = reporter.reportAnalysis(result);
              if (hasParserError) return;

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
            const blockStmt = astroUtil.serialize(node);
            const result = analyzeTypeScript(blockStmt, bindings);

            const s = node.position?.start?.offset ?? 0;
            const offset = s + 1; // 1: length of "{"

            const { hasParserError } = reporter.reportAnalysis(result);
            if (hasParserError) return;

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

      const transformed = unCtx.helpers.applyReplacements(
        code,
        allReplacements,
      );

      return {
        code: transformed,
      };
    },
  };
}

function handleTagNode(
  ctx: TransformerContext,
  code: string,
  node: TagLikeNode,
  bindings: ImportMetaBindings,
): TextReplacement[] {
  const allReplacements: TextReplacement[] = [];
  const reporter = createReporter(ctx);

  for (const attr of node.attributes) {
    if (
      attr.kind === "empty" || // skip boolean attributes
      attr.kind === "quoted" // skip string literal attributes
    ) {
      continue;
    }

    if (attr.kind === "shorthand" || attr.kind === "spread") {
      // TODO: contribution is welcome
      reporter.warn(
        `<${node.name}>: Skipping unsupported attribute syntax: ${attr.kind} for "${attr.name}"`,
      );
      continue;
    }

    if (includesImportMeta(attr.value)) {
      const result = analyzeTypeScript(attr.value, bindings);
      const { hasParserError } = reporter.reportAnalysis(result);
      if (hasParserError) continue;
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

interface SevereDiagnostics {
  error: DiagnosticMessage[];
  warning: DiagnosticMessage[];
}

function extractSevereDiagnostics(
  diagnostics: DiagnosticMessage[],
): SevereDiagnostics {
  const severe: SevereDiagnostics = {
    error: [],
    warning: [],
  };
  for (const diag of diagnostics) {
    if (diag.severity === DiagnosticSeverity.Warning) {
      severe.warning.push(diag);
    } else if (diag.severity === DiagnosticSeverity.Error) {
      severe.error.push(diag);
    }
  }
  return severe;
}
