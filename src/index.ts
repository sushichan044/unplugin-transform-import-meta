import type { UnpluginInstance } from "unplugin";

import { createUnplugin } from "unplugin";

import type { Options } from "./core/options";
import type { Writeable } from "./utils/types";

import { resolveOptions } from "./core/options";
import { createProcessor } from "./core/processors";

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
      async handler(this, code, id) {
        if (Object.keys(options.resolveRules).length === 0) {
          return code;
        }

        try {
          const processor = createProcessor(id);

          const transformResult = await processor.transform(
            code,
            id,
            options.resolveRules,
          );

          for (const warning of transformResult.warnings) {
            this.warn(warning);
          }

          return transformResult.code;
        } catch (error) {
          console.warn(`Failed to transform import.meta in code:`, error);
          return code;
        }
      },
    },
  };
});

export default unpluginTransformImportMeta;
