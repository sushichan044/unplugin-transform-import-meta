import { extname } from "pathe";

import type { LanguageProcessor } from "./types";

import { createAstroProcessor } from "./astro";
import { createECMAScriptProcessor } from "./ecmascript";
import { createVueProcessor } from "./vue";

type SupportedLanguage = "astro" | "ecma" | "vue";

export async function createProcessor(
  lang: SupportedLanguage,
): Promise<LanguageProcessor> {
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

/**
 * Detect the language of a filename.
 *
 * @param filename - The filename to detect the language of.
 * @returns The language of the filename, or null if unsupported.
 */
export function detectLanguage(filename: string): SupportedLanguage | null {
  if (isDtsLike(filename)) {
    return null;
  }

  const cleanExt = getCleanExt(filename);

  if (REGEX_ECMA_LIKE.test(cleanExt)) {
    return "ecma";
  }

  if (cleanExt === "astro") {
    return "astro";
  }

  if (cleanExt === "vue") {
    return "vue";
  }

  return null;
}

function getCleanExt(path: string): string {
  return extname(path).replace(/^\./, "").replace(/\?.*$/, "");
}

function isDtsLike(path: string): boolean {
  return REGEX_DTS_LIKE.test(path);
}

const REGEX_DTS_LIKE = /\.d\.[cm]?ts(\?.*)?$/;
const REGEX_ECMA_LIKE = /[cm]?[jt]sx?$/;
