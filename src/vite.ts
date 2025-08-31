/**
 * This entry file is for Vite plugin.
 *
 * @module
 */

import { unpluginTransformImportMeta } from "./index";

/**
 * Vite plugin
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import unpluginResolveImportMeta from 'unplugin-transform-import-meta/vite'
 *
 * export default defineConfig({
 *   plugins: [unpluginResolveImportMeta()],
 * })
 * ```
 */
const vite =
  unpluginTransformImportMeta.vite as typeof unpluginTransformImportMeta.vite;
export default vite;
export { vite as "module.exports" };
