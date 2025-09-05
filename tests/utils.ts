import { createTransformContext } from "../src/core/languages/context";

export function createTestContext(id: string) {
  return createTransformContext(
    {
      error: console.error,
      warn: console.warn,
    },
    id,
  );
}
