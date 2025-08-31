import type { TSESTree } from "@typescript-eslint/typescript-estree";
import type { Program } from "estree";

import { AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";
import { walk } from "estree-walker";

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
  ast: TSESTree.Program,
  resolveRules: ResolveRules,
): ImportMetaAnalysisResult {
  const transformations: CodeReplacement[] = [];
  const warnings: ExtractionWarning[] = [];

  walk(ast as Program, {
    enter(child: TSESTree.Node) {
      if (
        child.type !== AST_NODE_TYPES.MemberExpression &&
        child.type !== AST_NODE_TYPES.CallExpression
      ) {
        return;
      }

      if (child.type === AST_NODE_TYPES.MemberExpression) {
        const memberExpr = child;

        if (isImportMetaExpression(memberExpr)) {
          const accessPath = getAccessPath(memberExpr);

          if (
            isNonEmptyString(accessPath) &&
            resolveRules.properties?.[accessPath] !== undefined
          ) {
            const replacement = JSON.stringify(
              resolveRules.properties[accessPath],
            );
            transformations.push({
              end: child.range[1],
              replacement,
              start: child.range[0],
            });
          }
        }
      } else {
        const callExpr = child;

        if (
          callExpr.callee.type === AST_NODE_TYPES.MemberExpression &&
          isImportMetaExpression(callExpr.callee)
        ) {
          const methodPath = getAccessPath(callExpr.callee);

          if (
            isNonEmptyString(methodPath) &&
            resolveRules.methods?.[methodPath]
          ) {
            const literalArgs: Array<LiteralValue | null> = [];
            const nonLiteralArgs: Array<{ index: number; type: string }> = [];

            callExpr.arguments.forEach((arg, index) => {
              if (arg.type === AST_NODE_TYPES.Literal) {
                literalArgs.push(arg.value);
              } else {
                literalArgs.push(null);
                nonLiteralArgs.push({ index, type: arg.type });
              }
            });

            if (nonLiteralArgs.length > 0) {
              warnings.push({
                end: child.range[1],
                message: `Method ${methodPath} called with non-literal arguments`,
                methodName: methodPath,
                nonLiteralArgs,
                start: child.range[0],
              });
            }

            try {
              const result = resolveRules.methods[methodPath](...literalArgs);
              const replacement = JSON.stringify(result);

              transformations.push({
                end: child.range[1],
                replacement,
                start: child.range[0],
              });
            } catch (error) {
              console.warn(`Failed to execute method ${methodPath}:`, error);
            }
          }
        }
      }
    },
  });

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
