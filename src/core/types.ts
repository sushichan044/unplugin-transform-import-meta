import type { Awaitable } from "../utils/types";

/**
 * @package
 */
export type LiteralValue = bigint | boolean | number | string | RegExp | null;

type SerializableFunction = (
  ...args: readonly LiteralValue[]
) => Awaitable<LiteralValue>;

/**
 * Serializable values allowed to be inlined as JavaScript code.
 */
type SerializableValue =
  | LiteralValue
  | SerializableFunction
  | readonly LiteralValue[];

export type InfiniteSerializableValue =
  | SerializableValue
  | {
      readonly [key: string]: InfiniteSerializableValue;
    };

/**
 * @package
 */
export interface TextReplacement {
  end: number;
  replacement: string;
  start: number;
}

/**
 * @package
 */
/**
 * Shape for statically binding `import.meta.*` accesses at build time.
 *
 * - `values`: map a dotted access path to a literal that will be inlined.
 *   For example, `{ "env.MODE": "production" }` turns
 *   `import.meta.env.MODE` into `"production"` in the output.
 * - `functions`: map a dotted method path to a function that returns a
 *   literal. Arguments passed at the call site must be literals; any
 *   non-literal argument is passed to your function as `null` and a warning
 *   is reported during transformation.
 *
 * Example
 * ```ts
 * import type { ImportMetaBindings } from 'unplugin-transform-import-meta'
 *
 * const bindings: ImportMetaBindings = {
 *   values: {
 *     APP_NAME: 'my-app',
 *     'env.MODE': 'production',
 *     'config.database.host': 'localhost',
 *   },
 *   functions: {
 *     version: (v) => `v${v}`,
 *     asset: (p) => `/static/${p}`,
 *     'utils.resolve': (p) => `/resolved/${p}`,
 *   },
 * }
 * // input
 * //   console.log(import.meta.APP_NAME)
 * //   console.log(import.meta.version('1.2.3'))
 * //   console.log(import.meta.utils.resolve('a/b'))
 * // output
 * //   console.log('my-app')
 * //   console.log('v1.2.3')
 * //   console.log('/resolved/a/b')
 * ```
 */
export type ImportMetaBindings = {
  readonly [key: string]: InfiniteSerializableValue;
};

type BindingValueDefinition = {
  type: "value";
  value: LiteralValue | readonly LiteralValue[];
};

type BindingFunctionDefinition = {
  type: "function";
  value: SerializableFunction;
};

export type BindingDefinition =
  | BindingFunctionDefinition
  | BindingValueDefinition;

/**
 * @internal
 */
export type NormalizedImportMetaBindings = {
  readonly [key: string]: BindingFunctionDefinition | BindingValueDefinition;
};
