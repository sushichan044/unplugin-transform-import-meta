import type { Awaitable } from "../../utils/types";
import type { ResolveRules } from "../options";

/**
 * @package
 */
export interface TransformResult {
  code: string;
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
