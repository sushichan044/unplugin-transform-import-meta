import { rollupBuild, testFixtures } from "@sxzz/test-utils";
import path from "node:path";
import { describe } from "vitest";

import type { ImportMetaBindings } from "../src/api";

import unpluginResolveImportMeta from "../src/rollup";

describe("rollup", async () => {
  const { dirname } = import.meta;
  await testFixtures(
    "*.js",
    async (_args, id) => {
      const bindings = {
        functions: {
          bar: () => "method-result",
          getVersion: (...args) => `v${args[0]}`,
          resolveSomething: (...args) => `resolved-${args[0]}`,
        },
        values: {
          environment: "production",
          foo: "resolved-foo",
          NODE_ENV: "test",
        },
      } satisfies ImportMetaBindings;

      const { snapshot } = await rollupBuild(id, [
        unpluginResolveImportMeta({ bindings }),
      ]);
      return snapshot;
    },
    { cwd: path.resolve(dirname, "fixtures"), promise: true },
  );
});
