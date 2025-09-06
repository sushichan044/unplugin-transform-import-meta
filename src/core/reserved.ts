import type { ImportMetaBindings } from "./types";

interface ReservedAsserter {
  esbuild: () => void;
  farm: () => void;
  rolldown: () => void;
  rollup: () => void;
  rspack: () => void;
  vite: () => void;
  webpack: () => void;
  WinterTC: () => void;
}

/**
 * @package
 */
export function createReservedAssertion(
  bindings: ImportMetaBindings,
): ReservedAsserter {
  const inputProperties = Array.from(
    new Set([
      ...Object.keys(bindings.functions),
      ...Object.keys(bindings.values),
    ]),
  );

  return {
    esbuild: noop,
    farm: () => assertNotReserved("Farm", reservedByFarm, inputProperties),
    rolldown: () =>
      assertNotReserved("Rolldown", reservedByRolldown, inputProperties),
    rollup: noop,
    rspack: () =>
      assertNotReserved("RsPack", reservedByRsPack, inputProperties),
    vite: () => assertNotReserved("Vite", reservedByVite, inputProperties),
    webpack: () =>
      assertNotReserved("Webpack", reservedByWebpack, inputProperties),
    WinterTC: () =>
      assertNotReserved(
        "WinterTC",
        reservedPropertiesByWinterTC,
        inputProperties,
      ),
  };
}

class ReservedPropertyError extends Error {
  constructor(environment: string, property: string) {
    super(
      `The property name "import.meta.${property}" is reserved by ${environment} and cannot be used.`,
    );

    this.name = "ReservedPropertyError";
  }
}

function assertNotReserved(
  environment: string,
  registry: string[],
  input: string[],
): void {
  const errors: Error[] = [];

  for (const key of input) {
    if (registry.includes(key)) {
      errors.push(new ReservedPropertyError(environment, key));
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(errors, "Reserved property names found.");
  }
}

// stub function for bundlers not reserving non-standard properties
// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop(this: void): void {}

/**
 * @see {@link https://github.com/WinterTC55/import-meta-registry}
 */
const reservedPropertiesByWinterTC = [
  "url",
  "resolve",
  "main",
  "dirname",
  "filename",
  "dir",
  "file",
  "path",
];

const reservedByVite = [
  "hot", // https://vite.dev/guide/api-hmr.html#hmr-api
  "env", // https://vite.dev/guide/env-and-mode
  "glob", // https://vite.dev/guide/features.html#glob-import
];

/**
 * @see {@link https://github.com/farm-fe/farm/blob/147d30e592d02e6a9bc0b746696e0fe3b45df55c/packages/core/types/import-meta.d.ts#L10-L18}
 */
const reservedByFarm = ["hot", "env", "glob"];

const reservedByRolldown = [
  "browserBuild", // https://github.com/rolldown/rolldown/blob/f418b194e45acdeace25e5a02398cf2eaaa59293/packages/rolldown/src/types.d.ts#L4
];

/**
 * @see {@link https://github.com/web-infra-dev/rspack/blob/d0c0deeca517c7cb040b257dc698856f3b2d0f21/packages/rspack/module.d.ts#L218-L238}
 */
const reservedByRsPack = ["webpack", "webpackHot", "webpackContext"];

/**
 * @see {@link https://github.com/webpack/webpack/blob/20abdce9b00dd523ae2cf31caf482c3bc54dca4a/module.d.ts#L164-L183}
 */
const reservedByWebpack = ["webpack", "webpackHot", "webpackContext"];
