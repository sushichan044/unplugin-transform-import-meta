import type { FilterPattern } from "unplugin-utils";

import { isPlainObject } from "es-toolkit";

import type { NonReadOnly } from "../utils/types";
import type {
  ImportMetaBindings,
  InfiniteSerializableValue,
  NormalizedImportMetaBindings,
} from "./types";

import { REGEX_ASTRO_LIKE, REGEX_ECMA_LIKE, REGEX_VUE_LIKE } from "./languages";
import { isLiteralValue } from "./utils";

/**
 * @package
 */
export interface Options {
  bindings?: Partial<ImportMetaBindings>;
  enforce?: "post" | "pre" | undefined;
  exclude?: FilterPattern;
  include?: FilterPattern;
}

/**
 * @package
 */
export interface OptionsResolved {
  bindings: NormalizedImportMetaBindings;
  enforce?: "post" | "pre";
  exclude?: NonReadOnly<FilterPattern>;
  include?: NonReadOnly<FilterPattern>;
}

/**
 * @package
 */
export function resolveOptions(options: Options): OptionsResolved {
  const normalizedBindings = normalizeBindings(options.bindings ?? {});

  return {
    bindings: normalizedBindings,
    enforce: "enforce" in options ? options.enforce : "pre",
    exclude: (options.exclude as NonReadOnly<FilterPattern>) ?? [
      /node_modules/,
    ],
    include: (options.include as NonReadOnly<FilterPattern>) ?? [
      REGEX_ECMA_LIKE,
      REGEX_ASTRO_LIKE,
      REGEX_VUE_LIKE,
    ],
  };
}

/**
 * @package
 */
export function normalizeBindings(
  bindings: Partial<ImportMetaBindings>,
): NormalizedImportMetaBindings {
  const result: NonReadOnly<NormalizedImportMetaBindings> = {};

  // Detect cycles in nested objects to avoid infinite recursion
  const seenObjects = new WeakSet<Record<PropertyKey, unknown>>();

  function recurse(val: InfiniteSerializableValue, prefix: string) {
    if (isLiteralValue(val) || isArray(val)) {
      result[prefix] = {
        type: "value",
        value: val,
      };
      return;
    }

    if (typeof val === "function") {
      if (isClassLike(val)) {
        throw new TypeError(
          `Classes are not supported in bindings (at "${prefix}").`,
        );
      }

      result[prefix] = {
        type: "function",
        value: val,
      };
      return;
    }

    if (isPlainObject(val)) {
      const ref = val;
      if (seenObjects.has(ref)) {
        throw new TypeError(`Cycle detected in bindings at "${prefix}".`);
      }
      seenObjects.add(ref);

      for (const [key, value] of Object.entries(ref)) {
        if (key.includes(".")) {
          const at = prefix ? `${prefix}.${key}` : key;
          throw new TypeError(
            `Invalid key with dot detected at "${at}": object keys must not contain dots`,
          );
        }
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        recurse(value, newPrefix);
      }
      return;
    }

    throw new TypeError(
      "Unexpected value type in bindings: " + typeof (val satisfies never),
    );
  }

  for (const [key, value] of Object.entries(bindings)) {
    if (value === undefined) continue;

    if (key.includes(".")) {
      throw new TypeError(
        `Invalid top-level key with dot: "${key}". Object keys must not contain dots`,
      );
    }
    recurse(value, key);
  }

  return result;
}
