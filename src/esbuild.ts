/**
 * This entry file is for esbuild plugin.
 *
 * @module
 */

import { unpluginResolveImportMeta } from "./index";

/**
 * Esbuild plugin
 *
 * @example
 * ```ts
 * import { build } from 'esbuild'
 * import Starter from 'unplugin-resolve-import-meta/esbuild'
 *
 * build({ plugins: [Starter()] })
```
 */
const esbuild = unpluginResolveImportMeta.esbuild as typeof unpluginResolveImportMeta.esbuild;
export default esbuild;
export { esbuild as "module.exports" };
