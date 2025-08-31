import { rollupBuild, testFixtures } from "@sxzz/test-utils";
import path from "node:path";
import { describe } from "vitest";

import type { MethodFunction } from "../src/core/options";
import unpluginResolveImportMeta from "../src/rollup";

describe("rollup", async () => {
  const { dirname } = import.meta;
  await testFixtures(
    "*.js",
    async (_args, id) => {
      const resolveRules = id.includes("import-meta")
        ? {
            methods: {
              bar: (() => "method-result") as MethodFunction,
              getVersion: ((...args) => `v${args[0]}`) as MethodFunction,
              resolve: ((...args) => `resolved-${args[0]}`) as MethodFunction,
            },
            properties: {
              environment: "production",
              foo: "resolved-foo",
              NODE_ENV: "test",
            },
          }
        : {};

      const { snapshot } = await rollupBuild(id, [
        unpluginResolveImportMeta({ resolveRules }),
      ]);
      return snapshot;
    },
    { cwd: path.resolve(dirname, "fixtures"), promise: true },
  );
});
