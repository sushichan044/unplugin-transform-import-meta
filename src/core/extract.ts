import type { TSESTree } from "@typescript-eslint/typescript-estree";

import { AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";
import { walk } from "zimmerframe";

import type { LiteralValue, ResolveRules } from "./options";

import { isNonEmptyString } from "../utils/string";

export interface CodeReplacement {
  end: number;
  replacement: string;
  start: number;
}

export interface ExtractionWarning {
  end: number;
  message: string;
  methodName: string;
  nonLiteralArgs: Array<{
    index: number;
    type: string;
  }>;
  start: number;
}

export interface ImportMetaAnalysisResult {
  replacements: CodeReplacement[];
  warnings: ExtractionWarning[];
}

export function extractImportMetaReplacements(
  ast: TSESTree.Node,
  resolveRules: ResolveRules,
): ImportMetaAnalysisResult {
  const transformations: CodeReplacement[] = [];
  const warnings: ExtractionWarning[] = [];

  walk(
    ast,
    {},
    {
      MemberExpression: (node, c) => {
        if (!isImportMetaExpression(node)) {
          c.stop();
          return;
        }

        const accessPath = getAccessPath(node);
        if (
          isNonEmptyString(accessPath) &&
          resolveRules.properties?.[accessPath] !== undefined
        ) {
          const replacement = JSON.stringify(
            resolveRules.properties[accessPath],
          );
          transformations.push({
            end: node.range[1],
            replacement,
            start: node.range[0],
          });
        }
      },

      CallExpression: (node, c) => {
        if (
          !(
            node.callee.type === AST_NODE_TYPES.MemberExpression &&
            isImportMetaExpression(node.callee)
          )
        ) {
          c.stop();
          return;
        }

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
            const replacement = JSON.stringify(result);

            transformations.push({
              end: node.range[1],
              replacement,
              start: node.range[0],
            });
          } catch (error) {
            console.warn(`Failed to execute method ${methodPath}:`, error);
          }
        }
      },
    },
  );

  return {
    replacements: transformations,
    warnings,
  };
}

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

function isImportMetaExpression(node: TSESTree.MemberExpression): boolean {
  const path = findImportMetaPath(node);
  return path.length > 0;
}

function getAccessPath(node: TSESTree.MemberExpression): string | null {
  const path = findImportMetaPath(node);
  return path.length > 0 ? path.join(".") : null;
}
