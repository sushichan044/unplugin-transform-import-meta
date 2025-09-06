import { extname } from "pathe";

import type { LanguageProcessor } from "./types";

import { createAstroProcessor } from "./astro";
import { createECMAScriptProcessor } from "./ecmascript";

type SupportedLanguage = "astro" | "ecma";

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

  const cleanExt = cleanExtName(filename);

  if (REGEX_ECMA_LIKE.test(cleanExt)) {
    return "ecma";
  }

  // Not using regex for performance
  if (cleanExt === ".astro") {
    return "astro";
  }

  return null;
}

export const REGEX_ECMA_LIKE = /\.[cm]?[jt]sx?$/;
export const REGEX_ASTRO_LIKE = /\.astro$/;

function isDtsLike(path: string): boolean {
  return REGEX_DTS_LIKE.test(path);
}

const REGEX_DTS_LIKE = /\.d\.[cm]?ts(\?.*)?$/;

function cleanExtName(path: string): string {
  return extname(path).replace(/\?.*$/, "");
}
