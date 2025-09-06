import type { FilterPattern } from "unplugin-utils";

import type { NonReadOnly } from "../utils/types";
import type { ImportMetaBindings } from "./types";

import { REGEX_ASTRO_LIKE, REGEX_ECMA_LIKE } from "./languages";

/**
 * @package
 */
export interface Options {
  // Accept both new and legacy shapes
  bindings?: Partial<ImportMetaBindings>;
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
  return {
    bindings: {
      functions: options.bindings?.functions ?? {},
      values: options.bindings?.values ?? {},
    },
    enforce: "enforce" in options ? options.enforce : "pre",
    exclude: (options.exclude as NonReadOnly<FilterPattern>) ?? [
      /node_modules/,
    ],
    include: (options.include as NonReadOnly<FilterPattern>) ?? [
      REGEX_ECMA_LIKE,
      REGEX_ASTRO_LIKE,
    ],
  };
}
