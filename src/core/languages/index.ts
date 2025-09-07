import { extname } from "pathe";

import type { LanguageProcessor } from "./types";

import { createAstroProcessor } from "./astro";
import { createECMAScriptProcessor } from "./ecmascript";
import { createVueProcessor } from "./vue";

type SupportedLanguage = "astro" | "ecma" | "vue";

/**
 * @package
 */
export async function createProcessor(
  lang: SupportedLanguage,
): Promise<LanguageProcessor> {
  switch (lang) {
    case "ecma": {
      return createECMAScriptProcessor();
    }

    // eslint-disable-next-line perfectionist/sort-switch-case
    case "astro": {
      return await createAstroProcessor();
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
 *
 * @package
 */
export function detectLanguage(filename: string): SupportedLanguage | null {
  if (isDtsLike(filename)) {
    return null;
  }

  const cleanExt = cleanExtName(filename);

  if (REGEX_ECMA_LIKE.test(cleanExt)) {
    return "ecma";
  }

  if (REGEX_ASTRO_LIKE.test(cleanExt)) {
    return "astro";
  }

  if (REGEX_VUE_LIKE.test(cleanExt)) {
    return "vue";
  }

  return null;
}

export const REGEX_ECMA_LIKE = /\.[cm]?[jt]sx?(\?.*)?$/;
export const REGEX_ASTRO_LIKE = /\.astro(\?.*)?$/;
export const REGEX_VUE_LIKE = /\.vue(\?.*)?$/;

function isDtsLike(path: string): boolean {
  return REGEX_DTS_LIKE.test(path);
}

const REGEX_DTS_LIKE = /\.d\.[cm]?ts(\?.*)?$/;

function cleanExtName(path: string): string {
  return extname(path).replace(/\?.*$/, "");
}
