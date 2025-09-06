import type { FilterPattern } from "unplugin-utils";

import type { NonReadOnly } from "../utils/types";
import type { ResolveRules } from "./types";

import { REGEX_ASTRO_LIKE, REGEX_ECMA_LIKE } from "./languages";

export interface Options {
  enforce?: "post" | "pre" | undefined;
  exclude?: FilterPattern;
  include?: FilterPattern;
  resolveRules?: Partial<ResolveRules>;
}

export interface OptionsResolved {
  enforce?: "post" | "pre";
  exclude?: NonReadOnly<FilterPattern>;
  include?: NonReadOnly<FilterPattern>;
  resolveRules: ResolveRules;
}

export function resolveOptions(options: Options): OptionsResolved {
  return {
    enforce: "enforce" in options ? options.enforce : "pre",
    exclude: (options.exclude as NonReadOnly<FilterPattern>) ?? [
      /node_modules/,
    ],
    include: (options.include as NonReadOnly<FilterPattern>) ?? [
      REGEX_ECMA_LIKE,
      REGEX_ASTRO_LIKE,
    ],
    resolveRules: {
      methods: options.resolveRules?.methods ?? {},
      properties: options.resolveRules?.properties ?? {},
    },
  };
}
