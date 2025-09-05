import type { UnpluginContext } from "unplugin";

import { applyReplacements } from "../utils";

export interface TransformerContext {
  helpers: {
    applyReplacements: typeof applyReplacements;
  };
  id: string;
  logger: {
    error: UnpluginContext["error"];
    warn: UnpluginContext["warn"];
  };
}

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
