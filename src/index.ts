import type { UnpluginInstance } from "unplugin";

import { createUnplugin } from "unplugin";

import type { Options } from "./core/options";
import type { Writeable } from "./utils/types";

import { resolveOptions } from "./core/options";

export const Starter: UnpluginInstance<Options | undefined, false> =
  createUnplugin((rawOptions = {}) => {
    const options = resolveOptions(rawOptions);

    const name = "unplugin-resolve-import-meta";
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
              (options.exclude as Writeable<typeof options.exclude>) ??
              undefined,
            include:
              (options.include as Writeable<typeof options.include>) ??
              undefined,
          },
        },
        handler: () => "",
      },
    };
  });
