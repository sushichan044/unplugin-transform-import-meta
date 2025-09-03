import type { TSESTree } from "@typescript-eslint/typescript-estree";

import { AST_NODE_TYPES, parse } from "@typescript-eslint/typescript-estree";
import { walk } from "zimmerframe";

import type { ResolveRules } from "./options";
import type { LiteralValue } from "./serialize";
import type { CodeReplacement } from "./types";

import { isNonEmptyString } from "../utils/string";
import { includesImportMeta } from "./index";
import { serializeLiteralValue } from "./serialize";

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
  replacements: CodeReplacement[];
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
  const transformations: CodeReplacement[] = [];
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
            transformations.push({
              end: node.range[1],
              replacement,
              start: node.range[0],
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
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
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
              if (args.type === AST_NODE_TYPES.Literal) {
                literalArgs.push(args.value);
              } else {
                literalArgs.push(null);
                nonLiteralArgs.push({ index, type: args.type });
              }
            }

            if (nonLiteralArgs.length > 0) {
              warnings.push({
                end: node.range[1],
                message: `Method ${methodPath} called with non-literal arguments`,
                methodName: methodPath,
                nonLiteralArgs,
                start: node.range[0],
              });
            }

            try {
              const result = resolveRules.methods[methodPath](...literalArgs);
              const replacement = serializeLiteralValue(result);

              transformations.push({
                end: node.range[1],
                replacement,
                start: node.range[0],
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
function isImportMetaExpression(node: TSESTree.MemberExpression): boolean {
  const path = findImportMetaPath(node);
  return path.length > 0;
}

function getAccessPath(node: TSESTree.MemberExpression): string | null {
  const path = findImportMetaPath(node);
  return path.length > 0 ? path.join(".") : null;
}

/**
 * Find the import meta path from the node.
 * @param node - The node to find the import meta path from.
 * @returns The import meta path.
 */
function findImportMetaPath(node: TSESTree.MemberExpression): string[] {
  const path: string[] = [];
  let current = node;

  while (current.type === AST_NODE_TYPES.MemberExpression) {
    if (current.property.type === AST_NODE_TYPES.Identifier) {
      path.unshift(current.property.name);
    }

    if (
      current.object.type === AST_NODE_TYPES.MetaProperty &&
      current.object.meta.name === "import" &&
      current.object.property.name === "meta"
    ) {
      return path;
    }

    if (current.object.type === AST_NODE_TYPES.MemberExpression) {
      current = current.object;
    } else {
      break;
    }
  }

  return [];
}

function parseProgram(code: string): TSESTree.Node {
  const ast = parse(code, {
    comment: true,
    jsDocParsingMode: "none",
    jsx: true,
    loc: true,
    project: false,
    range: true,
    sourceType: "module",
    suppressDeprecatedPropertyWarnings: true,
    tokens: false,
  });

  return ast;
}
