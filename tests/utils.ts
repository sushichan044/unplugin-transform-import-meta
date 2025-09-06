import { createTransformContext } from "../src/api";

export function createTestContext(id: string) {
  return createTransformContext(
    {
      error: console.error,
      warn: console.warn,
    },
    id,
  );
}
