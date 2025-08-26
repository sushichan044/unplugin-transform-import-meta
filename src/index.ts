import { createUnplugin, type UnpluginInstance } from "unplugin";
import { createFilter } from "unplugin-utils";

import { type Options, resolveOptions } from "./core/options";

export const Starter: UnpluginInstance<Options | undefined, false> =
  createUnplugin((rawOptions = {}) => {
    const options = resolveOptions(rawOptions);
    const filter = createFilter(options.include, options.exclude);

    const name = "unplugin-resolve-import-meta";
    return {
      enforce: options.enforce,
      name,

      transformInclude(id) {
        return filter(id);
      },

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      transform(code, id) {
        return `// unplugin-resolve-import-meta injected\n${code}`;
      },
    };
  });
