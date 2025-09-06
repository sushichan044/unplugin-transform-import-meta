/**
 * This entry file is for Vite plugin.
 *
 * @module
 */

import { TransformImportMeta } from "./index";

/**
 * Vite plugin
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import TransformImportMeta from 'unplugin-transform-import-meta/vite'
 *
 * export default defineConfig({
 *   plugins: [TransformImportMeta()],
 * })
 * ```
 */
const vite = TransformImportMeta.vite as typeof TransformImportMeta.vite;
export default vite;
export { vite as "module.exports" };
