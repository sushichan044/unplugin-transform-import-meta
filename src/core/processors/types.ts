import type { Awaitable } from "../../utils/types";
import type { ResolveRules } from "../options";
import type { CodeReplacement } from "../types";

/**
 * @package
 */
export interface TransformResult {
  replacements: CodeReplacement[];
  warnings: string[];
}

/**
 * @package
 */
export interface LanguageProcessor {
  transform(
    code: string,
    filename: string,
    resolveRules: ResolveRules,
  ): Awaitable<TransformResult>;
}
