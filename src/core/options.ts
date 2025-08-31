import type { Literal } from "estree";
import type { FilterPattern } from "unplugin-utils";

export type LiteralValue = Literal["value"];

export type MethodFunction = (...args: LiteralValue[]) => LiteralValue;

export interface ResolveRules {
  methods?: Record<string, MethodFunction>;
  properties?: Record<string, LiteralValue>;
}

export interface Options {
  enforce?: "post" | "pre" | undefined;
  exclude?: FilterPattern;
  include?: FilterPattern;
  resolveRules?: ResolveRules;
}

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;

export type OptionsResolved = Overwrite<
  Required<Options>,
  Pick<Options, "enforce">
>;

export function resolveOptions(options: Options): OptionsResolved {
  return {
    enforce: "enforce" in options ? options.enforce : "pre",
    exclude: options.exclude ?? [/node_modules/],
    include: options.include ?? [/\.[cm]?[jt]sx?$/],
    resolveRules: options.resolveRules ?? {},
  };
}
