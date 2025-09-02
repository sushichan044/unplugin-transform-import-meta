import type { TSESTree } from "@typescript-eslint/typescript-estree";

import type { Awaitable } from "../../utils/types";
import type { ResolveRules } from "../options";

export interface ParseResult {
  ast: TSESTree.Node;

  code: string;

  warnings: string[];
}

export interface TransformResult {
  code: string;
  warnings: string[];
}

export interface LanguageProcessor {
  parse(code: string, filename: string): Awaitable<ParseResult>;

  transform(
    parseResult: ParseResult,
    resolveRules: ResolveRules,
  ): Awaitable<TransformResult>;
}
