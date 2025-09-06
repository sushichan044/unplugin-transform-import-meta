import type { MemberExpression, Node } from "@oxc-project/types";

import oxc from "oxc-parser";
import { walk } from "zimmerframe";

import type {
  ImportMetaBindings,
  LiteralValue,
  TextReplacement,
} from "./types";

import { isNonEmptyString } from "../utils/string";
import {
  includesImportMeta,
  isLiteralValue,
  serializeLiteralValue,
} from "./utils";

interface AnalysisError {
  end: number;
  message: string;
  meta?: Record<string, unknown>;
  start: number;
}

interface AnalysisResult {
  errors: AnalysisError[];
  replacements: TextReplacement[];
}

/**
 * Analyze the TypeScript code and return the replacements and warnings.
 * @param code - The TypeScript code to analyze.
 * @param bindings - The import.meta bindings.
 * @returns
 *
 * @package
 */
export function analyzeTypeScript(
  code: string,
  bindings: ImportMetaBindings,
): AnalysisResult {
  if (!includesImportMeta(code)) {
    return {
      errors: [],
      replacements: [],
    };
  }

  const ast = parseProgram(code);
  const replacements: TextReplacement[] = [];
  const errors: AnalysisError[] = [];

  walk(
    ast,
    {},
    {
      MemberExpression: (node, c) => {
        c.next();

        if (!isImportMetaExpression(node)) {
          return;
        }

        const accessPath = getAccessPath(node);
        const [start, end] = getRange(node);

        if (
          !isNonEmptyString(accessPath) ||
          bindings.values?.[accessPath] == null
        ) {
          return;
        }

        const value = bindings.values[accessPath];
        if (!isLiteralValue(value)) {
          errors.push({
            end,
            message: `Value for import.meta.${accessPath} is not a valid literal`,
            meta: {
              accessPath,
              value,
            },
            start,
          });
          return;
        }

        const replacement = serializeLiteralValue(bindings.values[accessPath]);

        replacements.push({
          end,
          replacement,
          start,
        });
      },

      CallExpression: (node, c) => {
        // Analyze args first.
        c.next();

        // Handle import.meta.method(...) calls.
        // This should be after than args to allow like import.meta.method(import.meta.property).
        // Check all args and abort traversal
        if (
          node.callee.type !== "MemberExpression" ||
          !isImportMetaExpression(node.callee)
        ) {
          return;
        }

        const methodPath = getAccessPath(node.callee);
        if (
          !isNonEmptyString(methodPath) ||
          bindings.functions?.[methodPath] == null
        ) {
          return;
        }

        const literalArgs: Array<LiteralValue | null> = [];
        for (const [index, args] of node.arguments.entries()) {
          if (args.type === "Literal") {
            literalArgs.push(args.value);
          } else {
            literalArgs.push(null);
            const [argStart, argEnd] = getRange(args);
            errors.push({
              end: argEnd,
              message: `Argument at index ${index} of method import.meta.${methodPath}() is not a literal`,
              meta: {
                argumentIndex: index,
                argumentType: args.type,
              },
              start: argStart,
            });
          }
        }

        const [callStart, callEnd] = getRange(node);

        try {
          const value = bindings.functions[methodPath](...literalArgs);

          if (!isLiteralValue(value)) {
            errors.push({
              end: callEnd,
              message: `Return value of method import.meta.${methodPath}() is not a valid literal`,
              meta: {
                method: methodPath,
                returnValue: value,
              },
              start: callStart,
            });
            return;
          }

          const replacement = serializeLiteralValue(value);
          replacements.push({
            end: callEnd,
            replacement,
            start: callStart,
          });
        } catch (error) {
          console.warn(
            `Failed to execute method import.meta.${methodPath}():`,
            error,
          );
        }
      },
    },
  );

  return {
    errors,
    replacements,
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
