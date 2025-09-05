import type { UnpluginInstance } from "unplugin";

import { createUnplugin } from "unplugin";

import type { Options } from "./core/options";
import type { Writeable } from "./utils/types";

import { createProcessor, detectLanguage } from "./core/languages";
import { createTransformContext } from "./core/languages/context";
import { resolveOptions } from "./core/options";

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
        if (Object.keys(options.resolveRules?.methods ?? {}).length === 0) {
          return;
        }
        if (Object.keys(options.resolveRules?.properties ?? {}).length === 0) {
          return;
        }

        const lang = detectLanguage(id);
        if (lang == null) {
          return;
        }

        const c = createTransformContext(
          {
            error: this.error.bind(this),
            warn: this.warn.bind(this),
          },
          id,
        );

        try {
          const processor = await createProcessor(lang);

          return await processor.transform(c, code, options.resolveRules);
        } catch (error) {
          console.warn(`Failed to transform import.meta in code:`, error);
          return code;
        }
      },
    },
  };
});

export default unpluginTransformImportMeta;
