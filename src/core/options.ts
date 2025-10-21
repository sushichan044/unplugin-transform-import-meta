import type { FilterPattern } from "unplugin-utils";

import type { NonReadOnly } from "../utils/types";
import type { ImportMetaBindings, UserImportMetaBindings } from "./types";

import { REGEX_ASTRO_LIKE, REGEX_ECMA_LIKE, REGEX_VUE_LIKE } from "./languages";
import { trySerializeValue } from "./utils";

/**
 * @package
 */
export interface Options {
  bindings?: UserImportMetaBindings;
  enforce?: "post" | "pre" | undefined;
  exclude?: FilterPattern;
  include?: FilterPattern;
}

/**
 * @package
 */
export interface OptionsResolved {
  bindings: ImportMetaBindings;
  enforce?: "post" | "pre";
  exclude?: NonReadOnly<FilterPattern>;
  include?: NonReadOnly<FilterPattern>;
}

/**
 * @package
 */
export function resolveOptions(options: Options): OptionsResolved {
  const normalizedBindings = normalizeBindings(options.bindings);

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
 * Normalize bindings to guarantee efficient lookups.
 *
 * @package
 */
export function normalizeBindings(
  bindings: UserImportMetaBindings | undefined,
): ImportMetaBindings {
  const normalizedDefine = Object.create(null) as Record<string, string>;

  const defineSource = bindings?.define ?? {};
  for (const [key, value] of Object.entries(defineSource)) {
    if (value === undefined) continue;
    normalizedDefine[key] = trySerializeValue(value, [key]);
  }

  const buildSource = bindings?.build ?? {};
  const build = Object.create(null) as ImportMetaBindings["build"];
  for (const [key, handler] of Object.entries(buildSource)) {
    if (handler === undefined) continue;
    if (typeof handler !== "function") {
      throw new TypeError(
        `bindings.build["${key}"] must be a function, received ${typeof handler}`,
      );
    }
    build[key] = handler;
  }

  return {
    build,
    define: normalizedDefine,
  };
}
