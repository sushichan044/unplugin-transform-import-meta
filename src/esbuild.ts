/**
 * This entry file is for esbuild plugin.
 *
 * @module
 */

import { TransformImportMeta } from "./index";

/**
 * Esbuild plugin
 *
 * @example
 * ```ts
 * import { build } from 'esbuild'
 * import TransformImportMeta from 'unplugin-transform-import-meta/esbuild'
 *
 * build({ plugins: [TransformImportMeta()] })
```
 */
const esbuild =
  TransformImportMeta.esbuild as typeof TransformImportMeta.esbuild;
export default esbuild;
export { esbuild as "module.exports" };
