import type { LanguageProcessor } from "./types";

import { createAstroProcessor } from "./astro";
import { createECMAScriptProcessor } from "./ecmascript";
import { createVueProcessor } from "./vue";

type SupportedLanguage = "astro" | "ecma" | "vue";

export async function createProcessor(id: string): Promise<LanguageProcessor> {
  const lang = detectLanguage(id);

  switch (lang) {
    case "astro": {
      return await createAstroProcessor();
    }
    case "ecma": {
      return createECMAScriptProcessor();
    }
    case "vue": {
      return await createVueProcessor();
    }

    default: {
      throw new Error(
        `Unsupported language: ${JSON.stringify(lang satisfies never)}`,
      );
    }
  }
}

export function detectLanguage(filename: string): SupportedLanguage {
  if (filename.endsWith(".astro")) {
    return "astro";
  }
  if (filename.endsWith(".vue")) {
    return "vue";
  }

  return "ecma";
}
