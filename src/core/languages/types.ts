import type { Awaitable } from "../../utils/types";
import type { TransformerContext } from "../context";
import { ResolveRules } from "../types";

/**
 * @package
 */
interface TransformResult {
  code: string;
  map?: string | null | undefined;
}

/**
 * @package
 */
export interface LanguageProcessor {
  transform(
    context: TransformerContext,
    code: string,
    rules: ResolveRules,
  ): Awaitable<TransformResult | null>;
}
