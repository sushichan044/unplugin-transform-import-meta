import type { UnpluginInstance } from "unplugin";

import { createUnplugin } from "unplugin";

import type { Options } from "./core/options";

import { createProcessor, detectLanguage } from "./core/languages";
import { createTransformContext } from "./core/languages/context";
import { resolveOptions } from "./core/options";
import { createReservedAsserter } from "./core/reserved";

export type { Options, ResolveRules } from "./core/options";

const pluginName = "unplugin-transform-import-meta";

export const unpluginTransformImportMeta: UnpluginInstance<
  Options | undefined,
  false
> = createUnplugin((rawOptions = {}) => {
  const options = resolveOptions(rawOptions);
  const assertNotReserved = createReservedAsserter(options.resolveRules);
  // Detect overridden reserved properties specified at import-meta-registry
  assertNotReserved.WinterTC();

  return {
    enforce: options.enforce,
    name: pluginName,

    transform: {
      filter: {
        code: {
          include: "import.meta",
        },
        id: {
          exclude: options.exclude ?? undefined,
          include: options.include ?? undefined,
        },
      },
      async handler(this, code, id) {
        if (
          Object.keys(options.resolveRules.methods).length === 0 ||
          Object.keys(options.resolveRules.properties).length === 0
        ) {
          return;
        }

        const lang = detectLanguage(id);
        if (lang == null) {
          this.warn(`Unsupported file type: ${id}`);
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
          this.warn(`Failed to transform ${id} (${String(error)})`);
          return;
        }
      },
    },

    // Detect overridden reserved properties in the appropriate hooks for each bundler
    esbuild: {
      setup: () => {
        assertNotReserved.esbuild();
      },
    },

    farm: {
      configResolved: () => {
        assertNotReserved.farm();
      },
    },

    rolldown: {
      buildStart: () => {
        assertNotReserved.rolldown();
      },
    },

    rollup: {
      buildStart: () => {
        assertNotReserved.rollup();
      },
    },

    rspack: () => {
      assertNotReserved.rspack();
    },

    vite: {
      configResolved() {
        assertNotReserved.vite();
      },
    },

    webpack: () => {
      assertNotReserved.webpack();
    },
  };
});

export default unpluginTransformImportMeta;
