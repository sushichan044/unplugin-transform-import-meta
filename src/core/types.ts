/**
 * @package
 */
export type LiteralValue = bigint | JSONPrimitive | RegExp;

/**
 * @package
 */
export type JSONPrimitive = boolean | number | string | null;

/**
 * Values that can be serialized into JavaScript source code for inlining.
 *
 * Functions inside {@link SerializableValue} are emitted verbatim via
 * `Function#toString()` and therefore must be side-effect free.
 *
 * @package
 */
export type SerializableValue =
  | LiteralValue
  | NoArgsFunction
  | SerializableArray
  | SerializableRecord;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoArgsFunction = (...args: never[]) => any;

type SerializableArray = readonly SerializableValue[];

type SerializableRecord = {
  readonly [key: number | string]: SerializableValue;
};

/**
 * @package
 */
type BuildHandler = (...args: LiteralValue[]) => SerializableValue;

/**
 * Shape for statically binding `import.meta.*` accesses at build time.
 *
 * - `define`: Map a dotted access path to a serializable value that inlines
 *   directly when encountered (e.g. `{ env: { MODE: "production" } }`).
 *   Functions are emitted as-is and must not rely on runtime arguments.
 * - `build`: Map a dotted method path to a function executed during the
 *   transform. Arguments at the call site must be literals. The return value
 *   must be serializable with the same rules as `define`.
 *
 * Example
 * ```ts
 * import type { ImportMetaBindings } from 'unplugin-transform-import-meta'
 *
 * const bindings: ImportMetaBindings = {
 *   define: {
 *     APP_NAME: 'my-app',
 *     'env.MODE': 'production',
 *     modules: {z
 *       './dir/foo.js': async () => import('./dir/foo.js'),
 *     },
 *   },
 *   build: {
 *     version: (v) => `v${v}`,
 *     asset: (p) => ({ url: `/static/${p}` }),
 *   },
 * }
 * // input
 * //   console.log(import.meta.APP_NAME)
 * //   console.log(import.meta.version('1.2.3'))
 * //   console.log(import.meta.modules['./dir/foo.js']())
 * // output
 * //   console.log('my-app')
 * //   console.log('v1.2.3')
 * //   console.log((async () => import('./dir/foo.js'))())
 * ```
 */
export interface UserImportMetaBindings {
  build?: Record<string, BuildHandler | undefined>;
  define?: Record<string, SerializableValue | undefined>;
}

/**
 * Normalized form used internally after option resolution.
 *
 * @internal
 */
export interface ImportMetaBindings {
  readonly build: Readonly<Record<string, BuildHandler>>;
  readonly define: Readonly<Record<string, string>>;
}

/**
 * @package
 */
export interface TextReplacement {
  end: number;
  replacement: string;
  start: number;
}
