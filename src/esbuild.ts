/**
 * This entry file is for esbuild plugin.
 *
 * @module
 */

import { unpluginTransformImportMeta } from "./index";

/**
 * Esbuild plugin
 *
 * @example
 * ```ts
 * import { build } from 'esbuild'
 * import Starter from 'unplugin-transform-import-meta/esbuild'
 *
 * build({ plugins: [Starter()] })
```
 */
const esbuild =
  unpluginTransformImportMeta.esbuild as typeof unpluginTransformImportMeta.esbuild;
export default esbuild;
export { esbuild as "module.exports" };
