import { isPlainObject } from "es-toolkit";
import MagicString from "magic-string";

import type {
  BindingDefinition,
  InfiniteSerializableValue,
  LiteralValue,
  NormalizedImportMetaBindings,
  SerializableValue,
  TextReplacement,
} from "./types";

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

  return JSON.stringify(value);
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
 * SerializableValue checker (JS serialization only).
 *
 * @package
 */
export function isSerializableValue(
  value: unknown,
): value is InfiniteSerializableValue {
  if (isLiteralValue(value)) return true;

  if (typeof value === "function") {
    if (isClassLike(value)) {
      // Classes are not supported
      return false;
    }

    return true;
  }
  if (Array.isArray(value)) return value.every((v) => isSerializableValue(v));

  if (isPlainObject(value)) {
    return Object.values(value).every((v) => isSerializableValue(v));
  }

  return false;
}

/**
 * Serialize SerializableValue into JavaScript code string.
 *
 * @package
 */
export function serializeValue(
  def: BindingDefinition,
  path: string[] = [],
): string {
  if (!isSerializableValue(def.value)) {
    const at = path.length > 0 ? ` at ${path.join(".")}` : "";
    throw new TypeError(
      `Value is not serializable${at}: ${typeof def.value} (${String(def.value)})`,
    );
  }

  switch (def.type) {
    case "function": {
      const src = def.value.toString();
      // wrap in parens and mark as PURE for tree-shaking friendliness
      return `(/*#__PURE__*/(${src}))`;
    }
    case "value": {
      if (isLiteralValue(def.value)) {
        return serializeLiteralValue(def.value);
      }
      if (isArray(def.value)) {
        const items = def.value.map((v, i) =>
          serializeValue({ type: "value", value: v }, [...path, String(i)]),
        );
        return `[${items.join(", ")}]`;
      }

      if (isPlainObject(def.value)) {
        const entries = Object.entries(def.value).map(([k, v]) => {
          const printedKey = isValidIdentifier(k) ? k : JSON.stringify(k);
          return `${printedKey}: ${serializeValue(v, [...path, k])}`;
        });
        return `{ ${entries.join(", ")} }`;
      }
    }
  }

  throw new TypeError(
    "Unexpected value type: " + typeof (value satisfies never),
  );
}

function isValidIdentifier(key: string): boolean {
  return /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(key);
}

/**
 * @package
 */
export function includesImportMeta(code: string): boolean {
  return code.includes("import.meta");
}

export function isArray<T>(obj: unknown): obj is readonly T[] {
  return Array.isArray(obj);
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function isClassLike(fn: Function): boolean {
  return typeof fn === "function" && fn.toString().startsWith("class");
}
