import { Result } from "@praha/byethrow";
import MagicString from "magic-string";

import type {
  JSONPrimitive,
  LiteralValue,
  SerializableValue,
  TextReplacement,
} from "./types";

import {
  isArray,
  isClassLike,
  isJSIdentifier,
  isPlainObject,
} from "../utils/javascript";
import { isStringifiedNumber } from "../utils/string";

/**
 * @package
 */
export function applyReplacements(
  source: string,
  replacements: TextReplacement[],
): string {
  if (replacements.length === 0) {
    return source;
  }

  const stableReplacements = replacements
    .slice()
    .sort((a, b) => a.start - b.start);

  const magicString = new MagicString(source);

  for (const { end, replacement, start } of stableReplacements) {
    magicString.overwrite(start, end, replacement);
  }

  return magicString.toString();
}

/**
 * Serialize complex values (arrays, objects, zero-arg functions) into
 * JavaScript source text.
 *
 * @package
 */
export function trySerializeValue(
  value: SerializableValue,
  path: readonly string[] = [],
  seen: WeakSet<object> = new WeakSet(),
): Result.Result<
  string,
  | "CANNOT_HANDLE_CIRCULAR_REFERENCES"
  | "CANNOT_SERIALIZE_CLASSES"
  | "CANNOT_SERIALIZE_FUNCTIONS_WITH_ARGS"
  | "INVALID_OBJECT_KEY_IDENTIFIERS"
  | "UNSUPPORTED_VALUE_TYPE"
> {
  if (isLiteralValue(value)) {
    return Result.succeed(serializeLiteralValue(value));
  }

  if (typeof value === "function") {
    if (isClassLike(value)) {
      return Result.fail("CANNOT_SERIALIZE_CLASSES");
    }

    if (value.length > 0) {
      return Result.fail("CANNOT_SERIALIZE_FUNCTIONS_WITH_ARGS");
    }

    const fn = value.toString();
    // https://github.com/javascript-compiler-hints/compiler-notations-spec/blob/4611bef6465e4fccad1998ee7f1263fafcdd08a4/pure-notation-spec.md
    return Result.succeed(`(/*#__PURE__*/(${fn}))`);
  }

  if (isArray(value)) {
    if (seen.has(value)) {
      return Result.fail("CANNOT_HANDLE_CIRCULAR_REFERENCES");
    }

    seen.add(value);
    const result = Result.pipe(
      Result.sequence(
        value.map((item, index) =>
          trySerializeValue(item, [...path, String(index)], seen),
        ),
      ),
      Result.map((elements) => `[${elements.join(", ")}]`),
    );
    seen.delete(value);

    return result;
  }

  if (isPlainObject(value)) {
    if (seen.has(value)) {
      return Result.fail("CANNOT_HANDLE_CIRCULAR_REFERENCES");
    }

    seen.add(value);
    const result = Result.pipe(
      Result.sequence(
        Object.entries(value).map(([key, child]) => {
          // Object.entries({1: 2}) //=> [["1", 2]];
          if (!isStringifiedNumber(key) && !isJSIdentifier(key)) {
            return Result.fail("INVALID_OBJECT_KEY_IDENTIFIERS");
          }

          const nextPath = [...path, key];
          return Result.pipe(
            trySerializeValue(child, nextPath, seen),
            Result.map((serializedChild) => `${key}: ${serializedChild}`),
          );
        }),
      ),
      Result.map((entries) => {
        if (entries.length === 0) {
          return "{}";
        }
        return `{ ${entries.join(", ")} }`;
      }),
    );
    seen.delete(value);

    return result;
  }

  return Result.fail("UNSUPPORTED_VALUE_TYPE");
}

/**
 * @package
 */
export function serializeLiteralValue(value: LiteralValue): string {
  if (value instanceof RegExp) {
    return value.toString();
  }

  if (typeof value === "bigint") {
    // The trailing "n" is not part of the string.
    return value.toString() + "n";
  }

  return JSON.stringify(value satisfies JSONPrimitive);
}

/**
 * @package
 */
export function isLiteralValue(value: unknown): value is LiteralValue {
  return (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    value instanceof RegExp ||
    typeof value === "bigint"
  );
}

/**
 * @package
 */
export function includesImportMeta(code: string): boolean {
  return code.includes("import.meta");
}

function formatDefinePath(path: readonly string[]): string {
  if (path.length === 0) {
    return "import.meta";
  }

  return `import.meta.${path.join(".")}`;
}
