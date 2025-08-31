/**
 * This entry file is for Vite plugin.
 *
 * @module
 */

import { unpluginResolveImportMeta } from "./index";

/**
 * Vite plugin
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import unpluginResolveImportMeta from 'unplugin-resolve-import-meta/vite'
 *
 * export default defineConfig({
 *   plugins: [unpluginResolveImportMeta()],
 * })
 * ```
 */
const vite = unpluginResolveImportMeta.vite as typeof unpluginResolveImportMeta.vite;
export default vite;
export { vite as "module.exports" };
