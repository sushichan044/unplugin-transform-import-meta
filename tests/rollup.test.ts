import { rollupBuild, testFixtures } from "@sxzz/test-utils";
import path from "node:path";
import { describe } from "vitest";

import Starter from "../src/rollup";

describe("rollup", async () => {
  const { dirname } = import.meta;
  await testFixtures(
    "*.js",
    async (args, id) => {
      const { snapshot } = await rollupBuild(id, [Starter()]);
      return snapshot;
    },
    { cwd: path.resolve(dirname, "fixtures"), promise: true },
  );
});
