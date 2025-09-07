import type { SFCDescriptor, SFCScriptBlock } from "@vue/compiler-sfc";

import type { TextReplacement } from "../types";
import type { LanguageProcessor } from "./types";

import { tryImport } from "../../utils/import";
import { isNonEmptyString } from "../../utils/string";
import { analyzeTypeScript } from "../analyze";
import { createReporter } from "../reporter";
import { includesImportMeta } from "../utils";

/**
 * Vue SFC processor (script + script setup only).
 *
 * - Uses `@vue/compiler-sfc` to locate blocks precisely.
 * - Skips template; only touches `<script>` and `<script setup>` contents.
 * - Skips external scripts with `src` attribute.
 *
 * @package
 */
export async function createVueProcessor(): Promise<LanguageProcessor> {
  const vue =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    await tryImport<typeof import("@vue/compiler-sfc")>("@vue/compiler-sfc");
  if (vue == null) {
    throw new Error(
      "Failed to import @vue/compiler-sfc. Please install it to process .vue files.",
    );
  }

  return {
    transform(c, code, bindings) {
      if (!includesImportMeta(code)) return null;
      const reporter = createReporter(c);

      const { descriptor, errors } = vue.parse(code, {
        filename: c.id,
        sourceMap: false,
      });
      if (errors.length > 0) {
        for (const err of errors) {
          reporter.error({ message: err.message, meta: err });
        }
        return null;
      }

      const scriptBlocks = correctScriptBlocks(descriptor);
      if (scriptBlocks.length === 0) return null;

      const allReplacements: TextReplacement[] = [];
      for (const block of scriptBlocks) {
        const result = analyzeTypeScript(block.content, bindings);
        const { hasParserError } = reporter.reportAnalysis(result);
        if (hasParserError) continue;

        const offset = block.loc.start.offset;

        const adjustedReplacements = result.replacements.map((replacement) => ({
          ...replacement,
          end: replacement.end + offset,
          start: replacement.start + offset,
        }));
        allReplacements.push(...adjustedReplacements);
      }

      return {
        code: c.helpers.applyReplacements(code, allReplacements),
      };
    },
  };
}

function correctScriptBlocks(descriptor: SFCDescriptor): SFCScriptBlock[] {
  const blocks: SFCScriptBlock[] = [];
  if (
    descriptor.script &&
    !isNonEmptyString(descriptor.script.src) &&
    isNonEmptyString(descriptor.script.content)
  ) {
    blocks.push(descriptor.script);
  }
  if (
    descriptor.scriptSetup &&
    !isNonEmptyString(descriptor.scriptSetup.src) &&
    isNonEmptyString(descriptor.scriptSetup.content)
  ) {
    blocks.push(descriptor.scriptSetup);
  }
  return blocks;
}
