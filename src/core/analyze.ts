import type { MemberExpression, Node } from "@oxc-project/types";

import oxc from "oxc-parser";
import { walk } from "zimmerframe";

import type { ResolveRules } from "./options";
import type { LiteralValue } from "./types";
import type { TextReplacement } from "./types";

import { isNonEmptyString } from "../utils/string";
import { includesImportMeta } from "./index";
import { serializeLiteralValue } from "./utils";

interface AnalysisWarning {
  end: number;
  message: string;
  methodName: string;
  nonLiteralArgs: Array<{
    index: number;
    type: string;
  }>;
  start: number;
}

interface AnalysisResult {
  replacements: TextReplacement[];
  warnings: AnalysisWarning[];
}

/**
 * Analyze the TypeScript code and return the replacements and warnings.
 * @param code - The TypeScript code to analyze.
 * @param resolveRules - The resolve rules to use.
 * @returns
 */
export function analyzeTypeScript(
  code: string,
  resolveRules: ResolveRules,
): AnalysisResult {
  if (!includesImportMeta(code)) {
    return {
      replacements: [],
      warnings: [],
    };
  }

  const ast = parseProgram(code);
  const transformations: TextReplacement[] = [];
  const warnings: AnalysisWarning[] = [];

  walk(
    ast,
    {},
    {
      MemberExpression: (node, c) => {
        if (isImportMetaExpression(node)) {
          const accessPath = getAccessPath(node);
          if (
            isNonEmptyString(accessPath) &&
            resolveRules.properties?.[accessPath] != null
          ) {
            const replacement = serializeLiteralValue(
              resolveRules.properties[accessPath],
            );
            const [start, end] = getRange(node);

            transformations.push({
              end,
              replacement,
              start,
            });
          }
        }

        c.next();
      },

      CallExpression: (node, c) => {
        // Analyze args first.
        c.next();

        // Handle import.meta.method(...) calls.
        // This should be after than args to allow like import.meta.method(import.meta.property).
        // Check all args and abort traversal
        if (
          node.callee.type === "MemberExpression" &&
          isImportMetaExpression(node.callee)
        ) {
          const methodPath = getAccessPath(node.callee);
          if (
            isNonEmptyString(methodPath) &&
            resolveRules.methods?.[methodPath]
          ) {
            const literalArgs: Array<LiteralValue | null> = [];
            const nonLiteralArgs: Array<{ index: number; type: string }> = [];

            for (const [index, args] of node.arguments.entries()) {
              if (args.type === "Literal") {
                literalArgs.push(args.value);
              } else {
                literalArgs.push(null);
                nonLiteralArgs.push({ index, type: args.type });
              }
            }

            const [start, end] = getRange(node);
            if (nonLiteralArgs.length > 0) {
              warnings.push({
                end,
                message: `Method ${methodPath} called with non-literal arguments`,
                methodName: methodPath,
                nonLiteralArgs,
                start,
              });
            }

            try {
              const result = resolveRules.methods[methodPath](...literalArgs);
              const replacement = serializeLiteralValue(result);

              transformations.push({
                end,
                replacement,
                start,
              });
            } catch (error) {
              console.warn(`Failed to execute method ${methodPath}:`, error);
            }
          }
          return;
        }
      },
    },
  );

  return {
    replacements: transformations,
    warnings,
  };
}

/**
 * Check if the node is an import meta expression.
 * @param node - The node to check.
 * @returns True if the node is an import meta expression, false otherwise.
 */
function isImportMetaExpression(node: MemberExpression): boolean {
  const path = findImportMetaPath(node);
  return path.length > 0;
}

function getAccessPath(node: MemberExpression): string | null {
  const path = findImportMetaPath(node);
  return path.length > 0 ? path.join(".") : null;
}

/**
 * Find the import meta path from the node.
 * @param node - The node to find the import meta path from.
 * @returns The import meta path.
 */
function findImportMetaPath(node: MemberExpression): string[] {
  const path: string[] = [];
  let current = node;

  while (current.type === "MemberExpression") {
    if (current.property.type === "Identifier") {
      path.unshift(current.property.name);
    }

    if (
      current.object.type === "MetaProperty" &&
      current.object.meta.name === "import" &&
      current.object.property.name === "meta"
    ) {
      return path;
    }

    if (current.object.type === "MemberExpression") {
      current = current.object;
    } else {
      break;
    }
  }

  return [];
}

function parseProgram(code: string): Node {
  const ast = oxc.parseSync("file.tsx", code, {
    astType: "ts",
    lang: "tsx",
    preserveParens: true,
    range: true,
    sourceType: "module",
  });

  return ast.program;
}

function getRange(node: Node): [number, number] {
  if (!node.range) {
    throw new Error(
      `Node does not have range: ${JSON.stringify(node)}. Did you forget to pass range: true to the oxc parser?`,
    );
  }
  return node.range;
}
