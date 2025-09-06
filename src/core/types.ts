/**
 * @package
 */
export type LiteralValue = bigint | boolean | number | string | RegExp | null;

/**
 * @package
 */
export type MethodFunction = (...args: LiteralValue[]) => LiteralValue;

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
export interface ImportMetaBindings {
  /** Dotted access path → function (e.g. "resolve", "utils.resolve"). */
  functions: Record<string, MethodFunction>;
  /** Dotted access path → literal value (e.g. "env", "config.database.host"). */
  values: Record<string, LiteralValue>;
}
