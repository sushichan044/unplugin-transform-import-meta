import type { MemberExpression, Program } from "estree";

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
  ast: Program,
  resolveRules: ResolveRules,
): ImportMetaAnalysisResult {
  const transformations: CodeReplacement[] = [];
  const warnings: ExtractionWarning[] = [];

  walk(ast, {
    enter(node) {
      if (node.type === "MemberExpression") {
        const memberExpr = node;

        if (isImportMetaExpression(memberExpr) && node.range) {
          const accessPath = getAccessPath(memberExpr);

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
        }
      } else if (node.type === "CallExpression") {
        const callExpr = node;

        if (
          callExpr.callee.type === "MemberExpression" &&
          isImportMetaExpression(callExpr.callee) &&
          node.range
        ) {
          const methodPath = getAccessPath(callExpr.callee);

          if (
            isNonEmptyString(methodPath) &&
            resolveRules.methods?.[methodPath]
          ) {
            const literalArgs: Array<LiteralValue | null> = [];
            const nonLiteralArgs: Array<{ index: number; type: string }> = [];

            callExpr.arguments.forEach((arg, index) => {
              if (arg.type === "Literal") {
                literalArgs.push(arg.value);
              } else {
                literalArgs.push(null);
                nonLiteralArgs.push({ index, type: arg.type });
              }
            });

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
        }
      }
    },
  });

  return {
    replacements: transformations,
    warnings,
  };
}

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

function isImportMetaExpression(node: MemberExpression): boolean {
  const path = findImportMetaPath(node);
  return path.length > 0;
}

function getAccessPath(node: MemberExpression): string | null {
  const path = findImportMetaPath(node);
  return path.length > 0 ? path.join(".") : null;
}
