import type { Program } from "estree";
import type { UnpluginInstance } from "unplugin";

import { createUnplugin } from "unplugin";

import type { Options } from "./core/options";
import type { Writeable } from "./utils/types";

import { extractImportMetaReplacements } from "./core/extract";
import { resolveOptions } from "./core/options";
import { parseProgram } from "./core/parse";
import { transformWithReplacements } from "./core/replacement";

export type { Options, ResolveRules } from "./core/options";

export const unpluginTransformImportMeta: UnpluginInstance<
  Options | undefined,
  false
> = createUnplugin((rawOptions = {}) => {
  const options = resolveOptions(rawOptions);

  const name = "unplugin-transform-import-meta";
  return {
    enforce: options.enforce,
    name,

    transform: {
      filter: {
        code: {
          include: "import.meta",
        },
        id: {
          exclude:
            (options.exclude as Writeable<typeof options.exclude>) ?? undefined,
          include:
            (options.include as Writeable<typeof options.include>) ?? undefined,
        },
      },
      handler(this, code) {
        if (Object.keys(options.resolveRules).length === 0) {
          return code;
        }

        try {
          const ast = parseProgram(code);

          const result = extractImportMetaReplacements(
            ast as Program,
            options.resolveRules,
          );

          if (result.warnings.length > 0) {
            for (const warning of result.warnings) {
              this.warn(
                `Warning: ${warning.message} at ${warning.start}-${warning.end}`,
              );
            }
          }

          if (result.replacements.length === 0) {
            return code;
          }

          return transformWithReplacements(code, result.replacements);
        } catch (error) {
          console.warn(`Failed to transform import.meta in code:`, error);
          return code;
        }
      },
    },
  };
});

export default unpluginTransformImportMeta;
