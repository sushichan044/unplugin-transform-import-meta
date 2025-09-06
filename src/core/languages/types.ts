import type { Awaitable } from "../../utils/types";
import type { TransformerContext } from "../context";
import type { ImportMetaBindings } from "../types";

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
    bindings: ImportMetaBindings,
  ): Awaitable<TransformResult | null>;
}
