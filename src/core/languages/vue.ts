import type { SFCDescriptor, SFCScriptBlock } from "@vue/compiler-sfc";

import type { TextReplacement } from "../types";
import type { LanguageProcessor } from "./types";

import { tryImport } from "../../utils/import";
import { isNonEmptyString } from "../../utils/string";
import { analyzeTypeScript } from "../analyze";
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

      const { descriptor } = vue.parse(code, {
        filename: c.id,
        sourceMap: false,
      });

      const scriptBlocks = correctScriptBlocks(descriptor);
      if (scriptBlocks.length === 0) return null;

      const allReplacements: TextReplacement[] = [];
      for (const block of scriptBlocks) {
        if (!isNonEmptyString(block.content)) continue;

        const result = analyzeTypeScript(block.content, bindings);
        if (result.errors.length > 0) {
          for (const err of result.errors) {
            c.logger.error({
              id: c.id,
              message: err.message,
              meta: err.meta,
            });
          }
        }

        const s = block.loc.start.offset;
        const offset = s;

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
  const blocks = [];
  if (descriptor.script && !isNonEmptyString(descriptor.script.src)) {
    blocks.push(descriptor.script);
  }
  if (descriptor.scriptSetup && !isNonEmptyString(descriptor.scriptSetup.src)) {
    blocks.push(descriptor.scriptSetup);
  }
  return blocks;
}
