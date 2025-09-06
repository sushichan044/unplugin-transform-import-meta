import type { FilterPattern } from "unplugin-utils";

import type { LiteralValue } from "./types";

export type MethodFunction = (...args: LiteralValue[]) => LiteralValue;

export interface ResolveRules {
  methods: Record<string, MethodFunction>;
  properties: Record<string, LiteralValue>;
}

export interface Options {
  enforce?: "post" | "pre" | undefined;
  exclude?: FilterPattern;
  include?: FilterPattern;
  resolveRules?: Partial<ResolveRules>;
}

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;

type OptionsResolved = Overwrite<
  Overwrite<Required<Options>, Pick<Options, "enforce">>,
  {
    resolveRules: ResolveRules;
  }
>;

export function resolveOptions(options: Options): OptionsResolved {
  return {
    enforce: "enforce" in options ? options.enforce : "pre",
    exclude: options.exclude ?? [/node_modules/],
    include: options.include ?? [
      /\.[cm]?[jt]sx?$/,
      /\.vue$/,
      /\.astro$/,
      /\.svelte$/,
    ],
    resolveRules: {
      methods: options.resolveRules?.methods ?? {},
      properties: options.resolveRules?.properties ?? {},
    },
  };
}
