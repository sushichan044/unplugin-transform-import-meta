import type { LanguageProcessor } from "./processors/types";

import { ECMAScriptParser } from "./processors/ecmascript";
import { VueParser } from "./processors/vue";

export type SupportedLanguage = "ecma" | "vue";

export function createProcessor(id: string): LanguageProcessor {
  const lang = detectLanguage(id);

  switch (lang) {
    case "ecma": {
      return new ECMAScriptParser();
    }
    case "vue": {
      return new VueParser();
    }

    default: {
      throw new Error(
        `Unsupported language: ${JSON.stringify(lang satisfies never)}`,
      );
    }
  }
}

export function detectLanguage(filename: string): SupportedLanguage {
  if (filename.endsWith(".vue")) {
    return "vue";
  }

  return "ecma";
}
