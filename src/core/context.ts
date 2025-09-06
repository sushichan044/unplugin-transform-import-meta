import type { UnpluginContext } from "unplugin";

import { applyReplacements } from "./utils";

interface TransformerLogger {
  error: UnpluginContext["error"];
  warn: UnpluginContext["warn"];
}

/**
 * @package
 */
export interface TransformerContext {
  helpers: {
    applyReplacements: typeof applyReplacements;
  };
  id: string;
  logger: TransformerLogger;
}

/**
 * @package
 */
export function createTransformContext(
  unpluginContext: UnpluginContext,
  id: string,
): TransformerContext {
  return {
    helpers: {
      applyReplacements,
    },
    id,
    logger: {
      error: unpluginContext.error.bind(unpluginContext),
      warn: unpluginContext.warn.bind(unpluginContext),
    },
  };
}
